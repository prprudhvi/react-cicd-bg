
def runSh(String script) {
    if (isUnix()) {
        sh script
    } else { 
        writeFile file: '.jenkins-sh.sh', text: script.replace('\r\n', '\n').replace('\r', '\n')
        bat '"C:\\Program Files\\Git\\bin\\bash.exe" -lxe .jenkins-sh.sh'
    }
}

pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(
            numToKeepStr: '20',
            artifactNumToKeepStr: '10'
        ))
    }

    environment {
        EC2_HOST = '18.61.62.93'
        EC2_USER = 'ubuntu'

        APP_DIR = '/var/www/node-service-dev'
        SSH_CREDENTIALS = 'ec2-ssh-key'
        SERVICE_PUBLIC_IP = '18.61.62.93'
        APP_PORT = '4001'

        RELEASE_ID = "release-${BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                script { runSh('npm ci') }
            }
        }

        stage('Lint') {
            steps {
                script { runSh('npm run lint') }
            }
        }

        stage('Unit Tests') {
            steps {
                script { runSh('npm test') }
            }
        }

        stage('Build') {
            steps {
                script {
                    runSh('''
                    npm run build

                    echo "Build completed"
                    ''')
                }
            }
        }

        stage('Archive Application') {
            steps {
                archiveArtifacts(
                    artifacts: '**/*',
                    excludes: 'node_modules/**,.git/**,.env,coverage/**',
                    fingerprint: true
                )
            }
        }

        stage('Deploy to EC2') {
            when {
                anyOf {
                    branch 'develop'
                    branch 'main'
                }
            }
            steps {
                sshagent(credentials: [SSH_CREDENTIALS]) {
                    script {
                    runSh('''
                        set -eu

                        SSH_OPTS="-o BatchMode=yes -o StrictHostKeyChecking=accept-new -o GSSAPIAuthentication=no -o ConnectTimeout=60"

                        echo "Creating remote release"

                        ssh $SSH_OPTS "$EC2_USER@$EC2_HOST" \
                          "mkdir -p '$APP_DIR/releases/$RELEASE_ID'"

                        echo "Transferring application"

                        tar -czf - \
                          --exclude=node_modules \
                          --exclude=.git \
                          --exclude=.env \
                          --exclude=coverage \
                          . | ssh $SSH_OPTS "$EC2_USER@$EC2_HOST" \
                          "tar -xzf - -C '$APP_DIR/releases/$RELEASE_ID'"

                        echo "Installing production dependencies"

                        ssh $SSH_OPTS "$EC2_USER@$EC2_HOST" \
                          bash -s -- "$APP_DIR" "$RELEASE_ID" <<'REMOTE'

                        set -eu

                        APP_DIR="$1"
                        RELEASE_ID="$2"

                        RELEASE_DIR="$APP_DIR/releases/$RELEASE_ID"
                        CURRENT="$APP_DIR/current"
                        TEMP_LINK="$APP_DIR/current.new"

                        PREVIOUS=$(readlink "$CURRENT" || true)

                        export PATH="$HOME/.local/bin:$HOME/.npm-global/bin:$HOME/.volta/bin:/usr/local/bin:$PATH"

                        if [ -s "$HOME/.nvm/nvm.sh" ]; then
                          export NVM_DIR="$HOME/.nvm"
                          set +u
                          # shellcheck disable=SC1090
                          . "$NVM_DIR/nvm.sh"
                          set -u
                        fi

                        if [ -x "$HOME/.local/share/fnm/fnm" ]; then
                          set +u
                          eval "$("$HOME/.local/share/fnm/fnm" env --shell bash)"
                          set -u
                        fi

                        if ! command -v npm >/dev/null 2>&1; then
                          echo "npm not found for non-interactive SSH as $(id -un)." >&2
                          echo "PATH=$PATH" >&2
                          exit 127
                        fi

                        echo "Freeing disk space"
                        df -h /

                        if command -v docker >/dev/null 2>&1; then
                          docker rm -f react-cicd-bg >/dev/null 2>&1 || true
                          docker system prune -af >/dev/null 2>&1 || true
                        fi

                        npm cache clean --force >/dev/null 2>&1 || true
                        sudo -n apt-get clean >/dev/null 2>&1 || true
                        sudo -n journalctl --vacuum-size=20M >/dev/null 2>&1 || true

                        if [ -d "$APP_DIR/releases" ]; then
                          ls -1dt "$APP_DIR"/releases/release-* 2>/dev/null |
                            tail -n +3 |
                            while read -r old_release; do
                              rm -rf -- "$old_release"
                            done
                        fi

                        df -h /

                        cd "$RELEASE_DIR"
                        npm ci --omit=dev

                        mkdir -p /var/log/node-service-dev

                        chmod -R u=rwX,g=rX,o= "$RELEASE_DIR"

                        rm -f "$TEMP_LINK"
                        ln -s "releases/$RELEASE_ID" "$TEMP_LINK"
                        mv -Tf "$TEMP_LINK" "$CURRENT"

                        if ! command -v pm2 >/dev/null 2>&1; then
                          echo "pm2 not found for non-interactive SSH as $(id -un)." >&2
                          echo "Install it on the EC2 host: sudo npm install -g pm2" >&2
                          exit 127
                        fi

                        if ! pm2 startOrReload \
                            "$CURRENT/ecosystem.config.js" \
                            --env production \
                            --update-env; then

                          echo "PM2 reload failed"

                          if [ -n "$PREVIOUS" ]; then
                            ln -s "$PREVIOUS" "$TEMP_LINK"
                            mv -Tf "$TEMP_LINK" "$CURRENT"
                            pm2 startOrReload \
                              "$CURRENT/ecosystem.config.js" \
                              --env production \
                              --update-env
                          else
                            rm -f "$CURRENT"
                            pm2 delete react-cicd-bg || true
                          fi

                          exit 1
                        fi

                        HEALTHY=false

                        for i in $(seq 1 30); do
                          if curl -fsS http://127.0.0.1:4001/health >/dev/null; then
                            HEALTHY=true
                            break
                          fi
                          sleep 2
                        done

                        if [ "$HEALTHY" != "true" ]; then
                          echo "Health check failed. Rolling back."

                          if [ -n "$PREVIOUS" ]; then
                            ln -s "$PREVIOUS" "$TEMP_LINK"
                            mv -Tf "$TEMP_LINK" "$CURRENT"
                            pm2 startOrReload \
                              "$CURRENT/ecosystem.config.js" \
                              --env production \
                              --update-env
                          else
                            rm -f "$CURRENT"
                            pm2 delete react-cicd-bg || true
                          fi

                          exit 1
                        fi

                        pm2 save

                        if ! command -v nginx >/dev/null 2>&1; then
                          echo "nginx is not installed on the EC2 host." >&2
                          exit 1
                        fi

                        sudo -n cp "$CURRENT/deploy/nginx/node-service-dev.conf" /etc/nginx/sites-available/node-service-dev
                        sudo -n ln -sfn /etc/nginx/sites-available/node-service-dev /etc/nginx/sites-enabled/node-service-dev
                        sudo -n rm -f /etc/nginx/sites-enabled/default
                        sudo -n nginx -t
                        sudo -n systemctl reload nginx

                        cd "$APP_DIR/releases"

                        ls -1dt release-* 2>/dev/null |
                          tail -n +6 |
                          while read -r old_release; do
                            rm -rf -- "$old_release"
                          done

                        echo "Deployment successful"
REMOTE

                        echo "Deployment finished successfully"
                    ''')
                    }
                }
            }
        }
    }

    post {

        success {
            echo 'NestJS GraphQL service deployed successfully.'
        }

        failure {
            echo 'Deployment failed. Check Jenkins console output.'
        }

        always {
            echo 'Pipeline execution completed.'
        }
    }
}

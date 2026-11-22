
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
        EC2_HOST = '40.192.69.205'
        EC2_USER = 'ubuntu'

        APP_DIR = '/var/www/node-service-dev'
        SSH_CREDENTIALS = 'ec2-ssh-key'

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
            steps {
                sshagent(credentials: [SSH_CREDENTIALS]) {
                    script {
                    runSh('''
                        set -eu

                        SSH_OPTS="-o BatchMode=yes -o StrictHostKeyChecking=accept-new -o GSSAPIAuthentication=no -o ConnectTimeout=20"

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

                        cd "$RELEASE_DIR"
                        npm ci --omit=dev

                        mkdir -p /var/log/node-service-dev

                        chmod -R u=rwX,g=rX,o= "$RELEASE_DIR"

                        rm -f "$TEMP_LINK"
                        ln -s "releases/$RELEASE_ID" "$TEMP_LINK"

                        mv -Tf "$TEMP_LINK" "$CURRENT"

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

                            if curl -fsS \
                              http://127.0.0.1:4001/health \
                              >/dev/null; then

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

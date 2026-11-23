
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
        EC2_HOST = '16.112.197.11'
        EC2_USER = 'ubuntu'

        APP_DIR = '/var/www/node-service-dev'
        SSH_CREDENTIALS = 'ec2-ssh-key'
        SERVICE_PUBLIC_IP = '16.112.197.11'
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

                        echo "Building and starting the Docker container"

                        ssh $SSH_OPTS "$EC2_USER@$EC2_HOST" \
                          bash -s -- "$APP_DIR" "$RELEASE_ID" "$SERVICE_PUBLIC_IP" "$APP_PORT" <<'REMOTE'

                        set -eu

                        APP_DIR="$1"
                        RELEASE_ID="$2"
                        PUBLIC_IP="$3"
                        PORT="$4"

                        IMAGE="react-cicd-bg"
                        CONTAINER="react-cicd-bg"
                        RELEASE_DIR="$APP_DIR/releases/$RELEASE_ID"
                        CURRENT="$APP_DIR/current"
                        TEMP_LINK="$APP_DIR/current.new"

                        if ! command -v docker >/dev/null 2>&1; then
                          echo "docker not found for $(id -un)." >&2
                          echo "Install Docker and add this user to the docker group." >&2
                          exit 127
                        fi

                        if ! docker info >/dev/null 2>&1; then
                          echo "docker is installed but $(id -un) cannot use the Docker socket." >&2
                          echo "Run: sudo usermod -aG docker $(id -un)" >&2
                          exit 1
                        fi

                        if ! command -v curl >/dev/null 2>&1; then
                          echo "curl is required on the host for the health check." >&2
                          exit 127
                        fi

                        if command -v pm2 >/dev/null 2>&1; then
                          pm2 delete "$CONTAINER" >/dev/null 2>&1 || true
                          pm2 save >/dev/null 2>&1 || true
                        fi

                        PREVIOUS_TAG="$(docker inspect -f '{{index .Config.Labels "release"}}' "$CONTAINER" 2>/dev/null || true)"
                        case "$PREVIOUS_TAG" in
                          ""|"<no value>") PREVIOUS_TAG="" ;;
                        esac

                        echo "Building $IMAGE:$RELEASE_ID"
                        docker build -t "$IMAGE:$RELEASE_ID" "$RELEASE_DIR"

                        start_container() {
                          tag="$1"
                          docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
                          docker run -d \
                            --name "$CONTAINER" \
                            --restart unless-stopped \
                            -p "${PORT}:${PORT}" \
                            -e NODE_ENV=production \
                            -e PORT="$PORT" \
                            -e SERVICE_PUBLIC_IP="$PUBLIC_IP" \
                            --label "release=$tag" \
                            "$IMAGE:$tag"
                        }

                        wait_healthy() {
                          i=1
                          while [ "$i" -le 30 ]; do
                            if curl -fsS "http://127.0.0.1:${PORT}/health" >/dev/null; then
                              return 0
                            fi
                            i=$((i + 1))
                            sleep 2
                          done
                          return 1
                        }

                        start_container "$RELEASE_ID"

                        if ! wait_healthy; then
                          echo "Health check failed. Rolling back." >&2
                          docker logs "$CONTAINER" >&2 || true

                          if [ -n "$PREVIOUS_TAG" ] && [ "$PREVIOUS_TAG" != "$RELEASE_ID" ]; then
                            start_container "$PREVIOUS_TAG"
                          else
                            docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
                          fi

                          exit 1
                        fi

                        rm -f "$TEMP_LINK"
                        ln -s "releases/$RELEASE_ID" "$TEMP_LINK"
                        mv -Tf "$TEMP_LINK" "$CURRENT"

                        docker images "$IMAGE" --format '{{.Tag}}' |
                          grep -E '^release-' |
                          tail -n +6 |
                          while read -r old_tag; do
                            docker rmi "$IMAGE:$old_tag" >/dev/null 2>&1 || true
                          done

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

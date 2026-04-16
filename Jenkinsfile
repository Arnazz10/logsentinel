pipeline {
    agent any

    options {
        timestamps()
        ansiColor('xterm')
        disableConcurrentBuilds()
        timeout(time: 60, unit: 'MINUTES')
    }

    environment {
        PYTHON_VERSION = "3.11"
        DOCKER_REGISTRY = "docker.io"
        IMAGE_PREFIX = "arnab/logsentinel" // Adjust with actual Docker Hub username or variable
        SERVICES = "log-ingestion-api log-processor ml-engine alert-service dashboard-backend"
        K8S_NAMESPACE = "logsentinel"
        HELM_RELEASE = "logsentinel"
        HELM_CHART_PATH = "infra/helm/logsentinel"
        
        // Jenkins Credentials IDs
        DOCKER_HUB_CREDS = "docker-hub-creds"
        KUBE_CONFIG_ID = "kube-config-id"
        AWS_CREDS = "aws-creds"
        LOGSENTINEL_SECRETS = "logsentinel-secrets"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Setup Python Environment') {
            steps {
                sh """
                    rm -rf .venv
                    python3 -m venv .venv
                    . .venv/bin/activate
                    python -m pip install --upgrade pip setuptools wheel
                    python -m pip install -r requirements.txt
                    python -m pip install flake8 black isort pytest pytest-cov pytest-asyncio httpx testcontainers locust
                    python --version
                """
            }
        }

        stage('Lint & Test') {
            steps {
                sh """
                    . .venv/bin/activate
                    black --check --diff services/ ml/ tests/
                    flake8 services/ ml/ tests/ --max-line-length=100 --exclude=__pycache__,.venv,migrations --ignore=E203,W503
                    isort --check-only --diff services/ ml/ tests/
                    python -m pytest tests/unit/ -v --tb=short --junitxml=test-results/unit-results.xml
                """
            }
            post {
                always {
                    junit testResults: 'test-results/unit-results.xml', allowEmptyResults: true
                    archiveArtifacts artifacts: 'test-results/**,coverage.xml,htmlcov/**', allowEmptyArchive: true
                }
            }
        }

        stage('Build & Push Docker Images') {
            when {
                branch 'main'
            }
            steps {
                catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
                    script {
                        def services = env.SERVICES.split(' ')
                        def parallelStages = [:]

                        services.each { service ->
                            parallelStages[service] = {
                                stage("Build ${service}") {
                                    withCredentials([usernamePassword(credentialsId: env.DOCKER_HUB_CREDS, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                                        sh """
                                            echo "${DOCKER_PASS}" | docker login -u "${DOCKER_USER}" --password-stdin ${env.DOCKER_REGISTRY}
                                            make build-service SERVICE=${service} IMAGE_TAG=${env.BUILD_NUMBER}
                                            make push-service SERVICE=${service} IMAGE_TAG=${env.BUILD_NUMBER}
                                        """
                                    }
                                }
                            }
                        }
                        parallel parallelStages
                    }
                }
            }
        }

        stage('Train ML Model') {
            when {
                allOf {
                    branch 'main'
                    anyOf {
                        changeset "ml/**"
                        changeset "services/ml-engine/**"
                    }
                }
            }
            steps {
                catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
                    script {
                        withCredentials([aws(credentialsId: env.AWS_CREDS, accessKeyVariable: 'AWS_ACCESS_KEY_ID', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY')]) {
                            sh """
                                . .venv/bin/activate
                                make train
                                # Upload to S3 if needed
                            """
                        }
                    }
                }
            }
            post {
                success {
                    archiveArtifacts artifacts: 'ml/models/**', allowEmptyArchive: true
                }
            }
        }

        stage('Deploy to Kubernetes') {
            when {
                branch 'main'
            }
            steps {
                catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
                    withCredentials([file(credentialsId: env.KUBE_CONFIG_ID, variable: 'KUBECONFIG')]) {
                        sh """
                            make k8s-namespace
                            make helm-install HELM_RELEASE=${env.HELM_RELEASE} NAMESPACE=${env.K8S_NAMESPACE} IMAGE_TAG=${env.BUILD_NUMBER}
                        """
                    }
                }
            }
        }

        stage('Integration Tests') {
            when {
                branch 'main'
            }
            steps {
                catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
                    sh """
                        . .venv/bin/activate
                        python -m pytest tests/integration/ -v --tb=short -m integration --junitxml=test-results/integration-results.xml
                    """
                }
            }
            post {
                always {
                    junit testResults: 'test-results/integration-results.xml', allowEmptyResults: true
                }
            }
        }
    }

    post {
        always {
            deleteDir()
        }
    }
}

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
        PYTHON_CI_IMAGE = "python:3.11-slim"
        HOST_REPO_PATH = "/home/arnab/CODE/logsentinel"
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

        stage('Lint & Test') {
            steps {
                sh """
                    set -eux
                    docker run --rm \
                      -v "${HOST_REPO_PATH}":/workspace \
                      -w /workspace \
                      "${PYTHON_CI_IMAGE}" \
                      bash -lc '
                        set -eux
                        rm -rf .venv-ci
                        python -m venv .venv-ci
                        . .venv-ci/bin/activate
                        python -m pip install --upgrade pip setuptools wheel
                        python -m pip install -r requirements.txt
                        python -m pip install flake8 black isort pytest pytest-cov pytest-asyncio httpx testcontainers locust
                        black --check --diff services/ ml/ tests/
                        flake8 services/ ml/ tests/ --max-line-length=100 --exclude=__pycache__,.venv,.venv-ci,migrations --ignore=E203,W503
                        isort --profile black --check-only --diff services/ ml/ tests/
                        mkdir -p test-results
                        python -m pytest tests/unit/ -v --tb=short --junitxml=test-results/unit-results.xml
                      '
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
                        sh """
                            set -eux
                            docker run --rm \
                              -v "${HOST_REPO_PATH}":/workspace \
                              -w /workspace \
                              "${PYTHON_CI_IMAGE}" \
                              bash -lc '
                                set -eux
                                python -m venv .venv-ci
                                . .venv-ci/bin/activate
                                python -m pip install --upgrade pip setuptools wheel
                                python -m pip install -r requirements.txt
                                python ml/train.py
                              '
                        """
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
                        set -eux
                        docker run --rm \
                          -v "${HOST_REPO_PATH}":/workspace \
                          -w /workspace \
                          "${PYTHON_CI_IMAGE}" \
                          bash -lc '
                            set -eux
                            python -m venv .venv-ci
                            . .venv-ci/bin/activate
                            python -m pip install --upgrade pip setuptools wheel
                            python -m pip install -r requirements.txt
                            python -m pip install pytest pytest-cov pytest-asyncio httpx testcontainers locust
                            mkdir -p test-results
                            python -m pytest tests/integration/ -v --tb=short -m integration --junitxml=test-results/integration-results.xml
                          '
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

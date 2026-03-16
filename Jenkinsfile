pipeline {
    agent any

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

        stage('Lint & Test') {
            steps {
                sh """
                    make setup
                    make lint
                    make test-unit
                """
            }
            post {
                always {
                    junit 'test-results/unit-results.xml'
                    archiveArtifacts artifacts: 'test-results/**,coverage.xml,htmlcov/**', allowEmptyArchive: true
                }
            }
        }

        stage('Build & Push Docker Images') {
            when {
                branch 'main'
            }
            steps {
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

        stage('Train ML Model') {
            when {
                branch 'main'
                changeset 'ml/**,services/ml-engine/**'
            }
            steps {
                withCredentials([aws(credentialsId: env.AWS_CREDS, accessKeyVariable: 'AWS_ACCESS_KEY_ID', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY')]) {
                    sh """
                        make train
                        # Upload to S3 if needed
                    """
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
                withCredentials([file(credentialsId: env.KUBE_CONFIG_ID, variable: 'KUBECONFIG')]) {
                    sh """
                        make k8s-namespace
                        make helm-install HELM_RELEASE=${env.HELM_RELEASE} NAMESPACE=${env.K8S_NAMESPACE} IMAGE_TAG=${env.BUILD_NUMBER}
                    """
                }
            }
        }

        stage('Integration Tests') {
            when {
                branch 'main'
            }
            steps {
                sh """
                    make test-integration
                """
            }
            post {
                always {
                    junit 'test-results/integration-results.xml'
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}

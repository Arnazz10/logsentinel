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
                    python3 -m venv .venv
                    . .venv/bin/activate
                    pip install --upgrade pip setuptools wheel
                    pip install -r requirements.txt
                    pip install flake8==6.1.0 black==23.11.0 isort==5.12.0 bandit==1.7.6 pytest==7.4.3 pytest-asyncio==0.21.1 pytest-cov==4.1.0 pytest-mock==3.12.0 httpx==0.25.2 anyio==4.1.0
                    
                    black --check --diff services/ ml/ tests/ --line-length=100 --target-version=py311
                    isort --check-only --diff services/ ml/ tests/ --profile=black --line-length=100
                    flake8 services/ ml/ tests/ --max-line-length=100 --exclude=__pycache__,.venv,migrations,*.egg-info --ignore=E203,W503,W504 --statistics --count
                    bandit -r services/ ml/ -ll -ii --exclude "tests/,__pycache__" -f txt
                    
                    pytest tests/unit/ -v --tb=short --cov=services --cov-report=term-missing --cov-report=xml:coverage.xml --cov-report=html:htmlcov --cov-fail-under=70 --junit-xml=test-results/unit-results.xml -m "not integration and not load" --asyncio-mode=auto
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
                                        docker build -t ${env.IMAGE_PREFIX}-${service}:latest -t ${env.IMAGE_PREFIX}-${service}:${env.BUILD_NUMBER} -f services/${service}/Dockerfile services/${service}
                                        docker push ${env.IMAGE_PREFIX}-${service}:latest
                                        docker push ${env.IMAGE_PREFIX}-${service}:${env.BUILD_NUMBER}
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
                        . .venv/bin/activate
                        pip install scikit-learn==1.3.2 pandas==2.1.3 numpy==1.26.2 joblib==1.3.2
                        python ml/train.py --n-normal 47500 --n-anomaly 2500 --n-estimators 100 --contamination 0.05 --random-state 42
                        
                        # Upload to S3 (assuming bucket name is known or passed as env)
                        # aws s3 cp ml/models/ s3://my-bucket/models/ --recursive
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
                        kubectl create namespace ${env.K8S_NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
                        helm upgrade --install ${env.HELM_RELEASE} ${env.HELM_CHART_PATH} \
                            --namespace ${env.K8S_NAMESPACE} \
                            --set "global.imageTag=${env.BUILD_NUMBER}" \
                            --set "global.imageRegistry=${env.IMAGE_PREFIX}" \
                            --atomic --timeout 8m --wait
                    """
                }
            }
        }

        stage('Integration Tests') {
            when {
                branch 'main'
            }
            steps {
                // This stage assumes Jenkins has Docker available to run sidecar containers 
                // or that the environment is pre-configured with these services.
                // Using a script block for more complex logic if needed.
                sh """
                    . .venv/bin/activate
                    # In a real Jenkins environment, you might use 'docker swim' or similar 
                    # Here we assume the services are accessible at localhost or via Docker network
                    python ml/train.py --n-normal 5000 --n-anomaly 250 --skip-eval
                    
                    export KAFKA_BOOTSTRAP_SERVERS=localhost:9092
                    export ELASTICSEARCH_HOST=localhost
                    export ELASTICSEARCH_PORT=9200
                    export REDIS_URL=redis://localhost:6379/0
                    export DATABASE_URL=postgresql+asyncpg://logsentinel:testpass@localhost:5432/logsentinel_test
                    export ML_MODEL_PATH=ml/models/isolation_forest.joblib
                    export ML_SCALER_PATH=ml/models/scaler.joblib
                    export ENVIRONMENT=test
                    
                    pytest tests/integration/ -v --tb=short --junit-xml=test-results/integration-results.xml -m "integration" --asyncio-mode=auto --timeout=120
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

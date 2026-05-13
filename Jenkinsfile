pipeline {
    agent any

    tools {
        maven 'Maven3'
    }

    environment {
        CHART_DIR       = 'helm/recipe-detection-chart'
        IMAGE_NAME      = 'hpe-recipe-detection'
        HELM_CMD        = 'helm'
        KUBE_NAMESPACE  = 'default'
        API_URL         = 'http://localhost:8081/api'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Determine Chart Version') {
            steps {
                script {
                    def chartYaml = readFile("${CHART_DIR}/Chart.yaml")
                    def versionLine = chartYaml.readLines().find { it.startsWith('version:') }
                    env.CHART_VERSION = versionLine.split(':')[1].trim()
                    env.IMAGE_TAG = env.CHART_VERSION
                    env.RELEASE_NAME = "recipe-v${env.CHART_VERSION.replace('.', '-')}"

                    // Check for per-version values file
                    env.VALUES_FILE = "${CHART_DIR}/values-v${env.CHART_VERSION}.yaml"
                    env.HAS_VERSION_VALUES = fileExists(env.VALUES_FILE) ? 'true' : 'false'

                    echo "Chart Version: ${env.CHART_VERSION}"
                    echo "Release Name: ${env.RELEASE_NAME}"
                    echo "Values file: ${env.VALUES_FILE} (exists: ${env.HAS_VERSION_VALUES})"
                }
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    bat 'mvn clean package -DskipTests'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    bat "minikube image build -t ${IMAGE_NAME}:${IMAGE_TAG} ."
                }
            }
        }

        stage('Deploy to Minikube') {
            steps {
                script {
                    def valuesArg = env.HAS_VERSION_VALUES == 'true'
                        ? "-f ${env.VALUES_FILE}" : ""

                    def releaseExists = bat(
                        script: "${HELM_CMD} status ${RELEASE_NAME} --namespace ${KUBE_NAMESPACE} 2>nul",
                        returnStatus: true
                    ) == 0

                    if (releaseExists) {
                        bat """
                            ${HELM_CMD} upgrade ${RELEASE_NAME} ${CHART_DIR} \
                                --namespace ${KUBE_NAMESPACE} \
                                ${valuesArg} \
                                --set image.tag=${IMAGE_TAG} \
                                --set image.pullPolicy=Never
                        """
                        echo "Upgraded Helm release: ${RELEASE_NAME}"
                    } else {
                        bat """
                            ${HELM_CMD} install ${RELEASE_NAME} ${CHART_DIR} \
                                --namespace ${KUBE_NAMESPACE} \
                                ${valuesArg} \
                                --set image.tag=${IMAGE_TAG} \
                                --set image.pullPolicy=Never
                        """
                        echo "Installed new Helm release: ${RELEASE_NAME}"
                    }
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                script {
                    bat "kubectl rollout status deployment/${RELEASE_NAME}-recipe-detection --namespace ${KUBE_NAMESPACE} --timeout=120s"

                    bat "${HELM_CMD} list --namespace ${KUBE_NAMESPACE}"
                    bat "kubectl get pods --namespace ${KUBE_NAMESPACE} -l app.kubernetes.io/instance=${RELEASE_NAME}"
                    bat "kubectl get configmaps --namespace ${KUBE_NAMESPACE} -l app.kubernetes.io/instance=${RELEASE_NAME}"
                }
            }
        }

        stage('Update Release Status') {
            steps {
                script {
                    bat """
                        curl -s -X PUT ${API_URL}/helm-releases/${env.CHART_VERSION}/status ^
                            -H "Content-Type: application/json" ^
                            -d "{\\"status\\":\\"deployed\\"}"
                    """
                    echo "Updated release ${env.CHART_VERSION} status to deployed"
                }
            }
        }
    }

    post {
        success {
            echo "Successfully deployed chart version ${env.CHART_VERSION} as release ${env.RELEASE_NAME}"
        }
        failure {
            script {
                bat """
                    curl -s -X PUT ${API_URL}/helm-releases/${env.CHART_VERSION}/status ^
                        -H "Content-Type: application/json" ^
                        -d "{\\"status\\":\\"failed\\"}" 2>nul
                """
            }
            echo "Deployment failed for chart version ${env.CHART_VERSION}"
        }
        always {
            cleanWs()
        }
    }
}

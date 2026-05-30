# HPE Recipe Detection

Automated Recipe Detection for Production Catalogs.

## Overview
This repository contains the complete, production-ready project scaffold for the HPE Recipe Detection tool. 

## Structure
- `backend/`: Java Spring Boot API
- `frontend/`: React UI
- `helm/`: Kubernetes configuration
- `docs/`: Comprehensive documentation and week-by-week implementation plan

## Quick Start
Refer to `QUICKSTART.md` for a 5-minute guide to get the environment running locally using Minikube and Helm.

## Kubernetes cluster mapping
The backend reads Kubernetes cluster mappings from `backend/src/main/resources/application.yml`.
Each logical cluster name in the UI maps to a kubeconfig context and namespace, so you can point `dev`, `prod`, `qa`, and `integration` at different Kubernetes clusters without changing code.

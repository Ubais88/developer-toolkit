export const JSON_SAMPLE = `{
  "service": "payments-api",
  "version": "2.7.1",
  "server": {
    "host": "0.0.0.0",
    "port": 8080,
    "cors": {
      "enabled": true,
      "origins": ["https://app.example.com", "https://admin.example.com"]
    }
  },
  "database": {
    "url": "postgres://db.internal:5432/payments",
    "pool": { "min": 2, "max": 20 },
    "ssl": true
  },
  "rateLimit": { "windowMs": 60000, "max": 120 },
  "features": ["refunds", "webhooks", "3ds"],
  "logging": { "level": "info", "redact": ["card.number"] }
}
`;

export const YAML_SAMPLE = `# Kubernetes deployment + service (two documents)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  labels:
    app: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: nginx:1.27-alpine
          ports:
            - containerPort: 80
          resources:
            limits:
              cpu: 500m
              memory: 256Mi
---
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  type: ClusterIP
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 80
`;

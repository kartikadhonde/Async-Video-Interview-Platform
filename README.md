# Async-Video-Interview-Platform
The platform is made up of 7 independent microservices, each running as its own Node.js or Python process. They do not share databases. They talk to each other either through the API Gateway (synchronous REST calls) or through RabbitMQ (asynchronous events).

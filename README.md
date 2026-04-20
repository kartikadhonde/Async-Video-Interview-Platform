# Async-Video-Interview-Platform
The platform is made up of 8 independent microservices, each running as its own Node.js or Python process. They do not share databases. They talk to each other either through the API Gateway (synchronous REST calls) or through RabbitMQ (asynchronous events).

The Question Service provides the fixed interview flow used by candidates:

1. Introduce yourself
2. What project are you proud of?
3. What are your strengths and weaknesses?
4. What do you hope to accomplish by joining our company?

Each question has a 1-minute limit, and candidates submit one continuous recording covering all questions.

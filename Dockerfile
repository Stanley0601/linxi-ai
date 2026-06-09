FROM node:22-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

ENV PORT=80
ENV LLM_API_KEY=your-api-key-here
ENV LLM_BASE_URL=https://api.deepseek.com/v1
ENV LLM_MODEL=deepseek-chat

EXPOSE 80
CMD ["npm", "start", "--", "-p", "80"]

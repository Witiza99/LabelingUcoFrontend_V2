# Stage 1
FROM node:20.9.0 as node

WORKDIR /usr/local/app

# Copia solo los archivos necesarios para npm install
COPY package.json package-lock.json* ./

RUN npm install

COPY ./ /usr/local/app

RUN npm run build --prod

# Stage 2
FROM nginx:alpine

COPY --from=node /usr/local/app/dist/frontend_labeling_uco /usr/share/nginx/html

# Exponer el puerto 80
EXPOSE 80

# Comando para iniciar nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]

#envsubst < /usr/share/nginx/html/assets/env.template.js > /usr/share/nginx/html/assets/env.js &&

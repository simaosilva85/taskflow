# Image légère et officielle. La version est figée pour des builds reproductibles.
FROM node:20-alpine

# wget sert au HEALTHCHECK ci-dessous (présent dans alpine, mais on est explicite).
WORKDIR /app

# On copie d'abord les manifestes pour profiter du cache Docker :
# tant que package.json ne change pas, l'install n'est pas refaite.
COPY package*.json ./
RUN npm install --omit=dev

# Puis le reste du code.
COPY . .

# Bonne pratique sécurité : ne pas tourner en root. L'image node fournit déjà
# un utilisateur "node" non privilégié.
USER node

ENV NODE_ENV=production
EXPOSE 3000

# Health check intégré à l'image : Docker (et Coolify) sait si le conteneur est sain.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]

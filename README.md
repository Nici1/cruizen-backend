# Projekt

# Backend-om se lahko zažene v direktorij react-project/api z ukazom: nodemon index.js
# Fronend-om se lahko zažene v direktorij react-project/client z ukazom: yarn dev

V obeh primerih lahko pride do napake, da se na danih vratih izvaja drug proces, kar pomeni, 
da je treba ta proces najprej uničiti. To lahko storite z ukazoma: npx kill-port 5000 (za backend) in npx kill-port 5175 (za frontend)

- Get a firebase account and create a project at https://console.firebase.google.com
- From the project's settings, get the Web API Key
- Run `npm run configure` and paste the api key.
- Create an account at zeit.co with `now login`, so you can deploy the app to staging/production right away.
- Before your first deployment, edit `now.json` and change the alias to a different subdomain, because `food-diary.now.sh` is mine! Also, set up secrets with `now secrets add gcm_api_key "$(cat .gcm_api_key)"`, and same for `vapid_public_key` and `vapid_private_key`.
- Deploy to a staging environment with `npm run stage` and open the url that pops up in the deployment log.
- Happy hacking :octopus:
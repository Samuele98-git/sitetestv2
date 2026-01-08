soes-ultimate/
├── docker-compose.yml
├── uploads/                  <-- IMPORTANT: Create this empty folder
│   └── .gitkeep              (optional: just to keep folder in git)
├── db/
│   └── init.sql
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    └── public/
        ├── index.html
        ├── modulistica.html  <-- NEW
        ├── contatti.html     <-- NEW
        ├── admin.html
        └── assets/
            └── logo.png      <-- Put your logo here











6. How to Configure Keycloak (Critical Step)

Since this is a fresh setup, you must configure Keycloak once the containers are running.

    Start the Stack:
    Bash

    docker-compose up --build

    Wait about 30-60 seconds for Keycloak to initialize.

    Access Keycloak Admin Console:

        Go to http://localhost:8080

        Click "Administration Console"

        Login with user: admin, password: admin

    Create Realm:

        Top left dropdown -> Create Realm.

        Realm Name: soes-realm.

        Click Create.

    Create Client (for the Frontend/Admin panel):

        Go to Clients -> Create Client.

        Client ID: soes-admin-client.

        Click Next.

        Standard Flow and Direct Access Grants enabled.

        Click Next.

        Valid Redirect URIs: http://localhost/* (or strictly http://localhost/admin.html).

        Web Origins: * (or http://localhost).

        Click Save.

    Create a User (Admin User):

        Go to Users -> Add user.

        Username: siteadmin.

        Click Create.

        Go to the Credentials tab.

        Set Password.

        Password: password.

        Toggle "Temporary" to Off.

        Click Save.

7. Testing

    Go to http://localhost. You will see the animated, modern site.

    Click Area Admin in the top right.

    You will be redirected to Keycloak. Login with siteadmin / password.

    You will be redirected back to the Dashboard.

    Edit the Hero Title and click Save.

    Go back to the homepage and refresh. The text has changed dynamically.
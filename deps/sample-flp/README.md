# SAP Fiori Launchpad Template

This repository hosts the SAP Fiori Launchpad template project (using Portal Service) for SAP Business Technology
Platform for the Cloud Foundry environment. It includes all the minimum set up required for deploying SAP Fiori
Launchpad with a **Sample App** configured in the launchpad.

TEMPLATE : https://github.com/jcailan/template-flp

## DEPLOYMENT

The template is ready for build and deploy to Cloud Foundry without any code change necessary.

1. After cloning the repo, go to file `mta.yaml`, do a `Ctrl+F` and perform a `find and replace` against the
   word `replaceme` to replace it with your preferred namespace.
2. Build the MTA project by running below CLI command:

```shell
> mbt build
```

3. Deploy to SAP BTP Cloud Foundry by running below CLI command:

```shell
> cf deploy mta_archives/<mtar-file>
```

## LOCAL TESTING

The **Sample App** is configured for local testing.

1. From the terminal, go to the directory folder `app-sample`, install node dependencies:

```shell
> npm install
```

2. Then run the local app router:

```shell
> npm start
```

3. The application router is available in below URL:

```swift
http://localhost:5000/
```
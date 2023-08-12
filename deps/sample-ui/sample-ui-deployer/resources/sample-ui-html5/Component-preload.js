sap.ui.require.preload({"sampleapp/Component.js":'sap.ui.define(["sap/fe/core/AppComponent"],function(e){"use strict";return e.extend("sampleapp.Component",{metadata:{manifest:"json"}})});',"sampleapp/ext/main/Main.controller.js":'sap.ui.define(["sap/fe/core/PageController"],function(e){"use strict";return e.extend("sampleapp.ext.main.Main",{})});',"sampleapp/ext/main/Main.view.xml":'<mvc:View xmlns:mvc="sap.ui.core.mvc" xmlns="sap.m"\n          controllerName="sampleapp.ext.main.Main"><Page id="Main" title="Main"><content><Panel width="auto" class="sapUiResponsiveMargin"><headerToolbar><OverflowToolbar><Title text="Header"/><ToolbarSpacer/><Button icon="sap-icon://settings"/><Button icon="sap-icon://drop-down-list"/></OverflowToolbar></headerToolbar><content><Text text="Lorem ipsum dolor st amet, consetetur sadipscing elitr,\n                    sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat,\n                    sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum.\n                    Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.\n                    Lorem ipsum dolor sit amet, consetetur sadipscing elitr,\n                    sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat,\n                    sed diam voluptua. Lorem ipsum dolor sit amet, consetetur sadipscing elitr,\n                    sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat"/></content></Panel></content></Page></mvc:View>',"sampleapp/i18n/i18n.properties":"# This is the resource bundle for sampleapp\n\n#Texts for manifest.json\n\n#XTIT: Application name\nappTitle=Sample App\n#YDES: Application description\nappDescription=A Fiori application.","sampleapp/manifest.json":'{"_version":"1.49.0","sap.app":{"id":"sampleapp","type":"application","i18n":"i18n/i18n.properties","applicationVersion":{"version":"0.0.1"},"title":"{{appTitle}}","description":"{{appDescription}}","resources":"resources.json","sourceTemplate":{"id":"@sap/generator-fiori:fpm","version":"1.10.4","toolsId":"ed31c6a7-24f0-44be-9a69-c11d4128431d"},"dataSources":{"mainService":{"uri":"sap/opu/northwind/odata/","type":"OData","settings":{"annotations":["annotation"],"localUri":"localService/metadata.xml","odataVersion":"4.0"}},"annotation":{"type":"ODataAnnotation","uri":"annotations/annotation.xml","settings":{"localUri":"annotations/annotation.xml"}}}},"sap.ui":{"technology":"UI5","icons":{"icon":"","favIcon":"","phone":"","phone@2":"","tablet":"","tablet@2":""},"deviceTypes":{"desktop":true,"tablet":true,"phone":true}},"sap.ui5":{"flexEnabled":true,"dependencies":{"minUI5Version":"1.117.0","libs":{"sap.m":{},"sap.ui.core":{},"sap.ushell":{},"sap.fe.templates":{}}},"contentDensities":{"compact":true,"cozy":true},"models":{"i18n":{"type":"sap.ui.model.resource.ResourceModel","settings":{"bundleName":"sampleapp.i18n.i18n"}},"":{"dataSource":"mainService","preload":true,"settings":{"synchronizationMode":"None","operationMode":"Server","autoExpandSelect":true,"earlyRequests":true}},"@i18n":{"type":"sap.ui.model.resource.ResourceModel","uri":"i18n/i18n.properties"}},"resources":{"css":[]},"routing":{"config":{},"routes":[{"name":"ProductsMain","pattern":":?query:","target":"ProductsMain"}],"targets":{"ProductsMain":{"type":"Component","id":"ProductsMain","name":"sap.fe.core.fpm","options":{"settings":{"navigation":{},"contextPath":"/Products","viewName":"sampleapp.ext.main.Main"}}}}}}}'},"sampleapp/Component-preload");
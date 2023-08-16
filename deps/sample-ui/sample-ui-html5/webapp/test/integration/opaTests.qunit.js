sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'com.sample.app/test/integration/FirstJourney',

    ],
    function (JourneyRunner, opaJourney,) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('com.sample.app') + '/index.html'
        });


        JourneyRunner.run(
            {
                pages: {}
            },
            opaJourney.run
        );
    }
);
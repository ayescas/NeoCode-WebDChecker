//
// checkwebd.js - PhantomJS script to check FileMaker Web Direct
// Vers. 1.0 , YP 12/04/2015
//
// Check if FileMaker Web Direct is working.
// Call:  phantomjs.exe checkwebd.js url=https://myfmserver.com/fmi/webd guest=1 "db=My DB Name Here With Spaces"
//
//
// Input parameters:
//	url - File Maker web direct page, for example https://fmserver.neocodesoftware.com/fmi/webd
//  guest - flag if we need to login as guest (optional). If guest=1 we'll try to login as a guest
//  db - DB name to check (optional). db=ANY - check if at least one DB is shown on Web Direct page
//									  db=MyDbName - check if MyDbName database is shown on Web Direct page
//
// Result: OK or FAIL
//
// Copyright © 2015 Neo Code Software Ltd
// Artisanal FileMaker & PHP hosting and development since 2002
// 1-888-748-0668 http://store.neocodesoftware.com
//
// History:
// 1.0 , YP 12/04/2015 - Initial release
//

var TIMEOUT = 30;					// Timeout after which we assume page was completely loaded (sec)
var CHECKPAGE_TIMEOUT = 5;			// check if page content changed every X seconds
									// Regexp to check if page loaded correctly /(LoginPageRegexp)|(ListOfDatabasesRegexp)/
var PAGECONTENT_REGEXP = '(Enter an account name and password to view databases hosted\ by FileMaker Server)|(<div [^>]*id="linksBox"[^>]*>\\s*<div [^>]+>\\s*<div [^>]+>\\s*<div [^>]+>\\s*<img [^>]+>\\s*</div>\\s*<div [^>]+>\\s*([^<]+)\\s*</div>)';		
                                    // Regexp to find DB in list of DBs on Filemaker Web Direct page
var FINDDB_REGEXP_START = '<div [^>]*id="linksBox"[^>]*>\\s*<div [^>]+>\\s*(<div [^>]+>\\s*<div [^>]+>\\s*<img [^>]+>\\s*</div>\\s*<div [^>]*class="v-label v-widget v-has-width"[^>]*>[^<]+</div>\\s*</div>\\s*)*<div [^>]+>\\s*<div [^>]+>\\s*<img [^>]+>\\s*<\/div>\\s*<div [^>]*class="v-label v-widget v-has-width"[^>]*>';
var FINDDB_REGEXP_END = '</div>\\s*</div>';
var INPUT = {'url': '', 'guest': '', 'db': ''};	// Save script input parameters here

var FM_GUEST_RADIO_ID = 'gwt-uid-5';  // Guest radio button Id on web direct page


var loadInProgress = false;         // Flag if page is loading
var testindex = 0;                  // step index
var gotoNextStep = 1;               // flag if we can proceed to next step

var page = require('webpage').create();
page.onConsoleMessage = function(msg) {   // Catch page console messages
//    console.log('console> '+msg);
};
page.onAlert = function(msg) {            // Catch page alerts
//    console.log('alert!!> ' + msg);
};

page.onLoadStarted = function() {         // page start loading
    loadInProgress = true;
//    console.log("load started");
};

page.onLoadFinished = function(status) {  // page loaded
    loadInProgress = false;
    if (status !== 'success') {
      console.log('FAIL');
      phantom.exit();
    } else {
//    console.log("load finished");
    }
};

// checkPageLoaded - check if page loaded. Use PAGECONTENT_REGEXP for checking
// Call:	res = checkPageLoaded(content)
// Where:	res - result: true or false
//			content - page content
//
function checkPageLoaded(content) {
  var re = new RegExp(PAGECONTENT_REGEXP);
  return re.test(content);
}

// checkPageContent - check content of the page, search list of DBs. Check for certain DB if required
// Call:	res = checkPageContent(content,db);
// Where:	res - result: true or false. 
//			content - page content
//			db - db we are looking for
//
function checkPageContent(content,db) {
  var re = new RegExp(FINDDB_REGEXP_START + (db == 'ANY' ? '[^<]+' : db) + FINDDB_REGEXP_END);
  return re.test(content);
}

var steps = [
    function() {								// 1. Load page
	  page.open(INPUT['url']);
	  gotoNextStep = 1;
    },

    function() {								// 2. Check first page
	  var content = '';
   	  var chPageInterval = setInterval(function() {
	  if (page.content != content) {			// Content changed
		content = page.content;
          if (checkPageLoaded(content)) { 		// Check if we have good result here
 		    clearInterval(chPageInterval);  	// Stop checking page
  		    gotoNextStep = 1;					// We can proceed to next step
          }
        } 
	  }, CHECKPAGE_TIMEOUT);
    },
	
    function() {								// 3. Login (optional)
	  if(INPUT['guest']){   								// do guest login
	    page.evaluate(function(id){
		  document.getElementById(id).click();
	    },FM_GUEST_RADIO_ID);
	    page.sendEvent('keypress', page.event.key.Enter, null, null, 0);
	    gotoNextStep = 1;						// go to next step
      }
	  else if (INPUT['login']) {				// do login with login /pass
		gotoNextStep = 1;						// Not implemented yet
 	  }
	  else {									// skip this step, just proceed to next step
		gotoNextStep = 1;						// go to next step
	  }
    },

    function() {								// 4. Check final content
	  if (INPUT['db']) {						// Check if we have DBs on the page
	    var content = '';
   	    var chPageInterval = setInterval(function() {
 	      if (page.content != content) {			// Content changed
		    content = page.content;
            if (checkPageContent(page.content,INPUT['db'])) { 		// Check if we have good result here
              console.log("OK");
 		      clearInterval(chPageInterval);  	// Stop checking page
  		      gotoNextStep = 1;					// We can proceed to next step
           }
          }  
	    }, CHECKPAGE_TIMEOUT);
	  }
      else {									// Don't need to check DBs. First page was loaded correctly - return OK
		console.log("OK"); 
	    gotoNextStep = 1;		
	  }	  
    },

    function() {
	  gotoNextStep = 1;
    }
];

												// Start HERE
var system = require("system");					// Load Input parameters in INPUT
system.args.forEach(function(arg, i) {
  for (var v in INPUT) {
    var re = new RegExp("^" + v + "=(.+)");
    var res = arg.match(re);					// Return all found results
    if (res) {
	  INPUT[v] = res[1];
    }
  }	
});


var dt,startTime;									// Timer variables
var interval = setInterval(function() {
    if (!loadInProgress &&  gotoNextStep && typeof steps[testindex] == "function") {		// If page is loaded and we are done with content
   	  gotoNextStep = 0;
      dt = new Date();
      startTime = dt.getTime();						// Start timer before running next function
      steps[testindex]();
      testindex++;
    }
    else if (typeof steps[testindex] != "function" &&  gotoNextStep) {
        phantom.exit();
    }
    else if (startTime)	 {							// We have start time of running function
      console.log(" ");                             // Output this for php script to show that we are still alive
	  dt = new Date();								// Check if reach timeout
      if (dt.getTime() - startTime > TIMEOUT*1000) { // Timeout is in seconds. getTime in milliseconds
        console.log("FAIL");
        phantom.exit();
      }
    }	
}, 200);



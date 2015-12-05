<?php

// index.php - Process web requests to check FileMaker Web Direct
// Vers. 1.0 , YP 12/04/2015
//
// Check if FileMaker Web Direct is working.
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

include_once('class.Log.php');		// Log class
$phantomPath = 'D:\phantomjs\bin\phantomjs.exe';
$checkScript = 'checkwebd.js';
									// Start here
set_error_handler("error_handler", E_ALL); // Catch all error/notice messages
set_time_limit(60);					// Maximum execution time

$log = new LOG('index.log');
$url = array_key_exists('url',$_REQUEST) ? $_REQUEST['url'] : '';
$db = array_key_exists('db',$_REQUEST) ? $_REQUEST['db'] : '';
$guest = array_key_exists('guest',$_REQUEST) ? $_REQUEST['guest'] : '';

if (!$url) {
  print "FAIL";
  exit;
}

try {
  $cmd = "$phantomPath $checkScript url=$url ".($guest ? "guest=1" : "")." ".($db ? "\"db=$db\"" : "");
  exec($cmd,$output);
  print str_replace(array(' ',"\n"),'',join('',$output));
}
catch (Exception $e) {				// some error
  $log->message("Send command error: ".$e->getMessage());
  print "FAIL";
}
exit;

//
// error_handler - catch notice and warnings
//
function error_handler($errno, $errstr) {
  global $log;
    if($errno == E_WARNING) {
	  $log->message("Warning: ".$errstr);        
//  	throw new Exception($errstr);
    } else if($errno == E_NOTICE) {
//      throw new Exception($errstr);
	  $log->message("Notice: ".$errstr); 
	}
}								// -- error_handler --


?>
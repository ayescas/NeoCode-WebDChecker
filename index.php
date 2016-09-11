<?php

// index.php - Process web requests to check FileMaker Web Direct
// Vers. 1.2 , YP 08/07/2016
//
// Check if FileMaker Web Direct is working.
//
// Input parameters:
//	url - File Maker web direct page, for example https://fmserver.neocodesoftware.com/fmi/webd
//				admin console example: https://fmserver.neocodesoftware.com:16000/admin-console
//  guest - flag if we need to login as guest (optional). If guest=1 we'll try to login as a guest
//  db - DB name to check (optional). db=ANY - check if at least one DB is shown on Web Direct page
//									  db=MyDbName - check if MyDbName database is shown on Web Direct page
//	login - admin login name for admin console check
//	pass - password for admin console check
//
// Result: OK or FAIL
//
// Copyright © 2015 Neo Code Software Ltd
// Artisanal FileMaker & PHP hosting and development since 2002
// 1-888-748-0668 http://store.neocodesoftware.com
//
// History:
// 1.0 , YP 12/04/2015 - Initial release
// 1.1 , YP 08/07/2016 - Added admin console check
// 1.2 , YP 09/10/2016 - Added SMS sending on check fail
//

include_once('config.php');			// config
$phantomPath = 'D:\phantomjs\bin\phantomjs.exe';
$checkScript = 'checkwebd.js';
									// Default login and pass to test admin console
$LOGIN = 'sample';
$PASS = 'Sampl3';
									// Start here
set_error_handler("error_handler", E_ALL); // Catch all error/notice messages
set_time_limit(60);					// Maximum execution time

$url = array_key_exists('url',$_REQUEST) ? $_REQUEST['url'] : '';
$db = array_key_exists('db',$_REQUEST) ? $_REQUEST['db'] : '';
$guest = array_key_exists('guest',$_REQUEST) ? $_REQUEST['guest'] : '';
$login = array_key_exists('login',$_REQUEST) ? $_REQUEST['login'] : '';
$pass = array_key_exists('pass',$_REQUEST) ? $_REQUEST['pass'] : '';

									// We can use login pass from parameters, but don't want to enable it for now
									// Use only default login/pass for now.
$login = $LOGIN;			
$pass = $PASS;


if (!$url) {
  print "FAIL";
  exit;
}

try {
  $cmd = "$phantomPath $checkScript url=$url ";
  if (preg_match('/admin-console$/', $url, $matches)) {		// check if we are testing admin-console
    $cmd .= "type=admin login=$login pass=$pass";
  }
  else {	  												// webd check
	$cmd .= ($guest ? "guest=1 " : "").($db ? "\"db=$db\"" : "");
  }	
//  $LOG->message($cmd);
/*
  $process = popen($cmd, "r");
  $buffer = '';
  while(!feof($process))  {
	$buffer .= fgets($process);
  }
  print str_replace(array(' ',"\n"),'',$buffer);
  pclose($process);
*/
  exec($cmd,$output);
//  print_r($output);
  $res = str_replace(array(' ',"\n"),'',join('',$output));
  print $res;
												// Do we need to send SMS on check fail?
  if ($res == 'FAIL' && $CONFIG['SEND_SMS_ON_FAIL']) {	
    $smsRes = $SMS->sendSMS($CONFIG['SMS_DEST'],$CONFIG['SMS_SRC'],$CONFIG['SMS_TEXT']);	  
    $LOG->message("Send SMS result: $smsRes");
  }
}
catch (Exception $e) {				// some error
  $LOG->message("Send command error: ".$e->getMessage());
  print "FAIL";
}
exit;


?>

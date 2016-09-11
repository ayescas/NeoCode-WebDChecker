<?php
/**
 * Send SMS class
 * Created by Yurii.
 * Date: 12/7/2015
 * Time: 5:23 PM
 */


class Sms {
  function __construct($cfg) {
	$this->CFG = $cfg;
  }

  // Send SMS 
  // Call:  $status = $sms->sendSMS($to,$from,$msg);
  // Where: $status - result
  // $to - destination number
  // $from - from number
  // $msg - message to sent
  public function sendSMS($to,$from,$msg) {
print "here\n";	  
    try {
      $json_data = str_replace('"','\"',json_encode(array('src' => $from, 'dst' => $to, 'text' => $msg)));
      $cmd = $this->CFG['CURL_PATH'].' -i --user '.$this->CFG['SMS_KEY'].
             ' -H "Content-Type: application/json" -d '.
             '"'.$json_data.'"'.
             ' '.$this->CFG['SMS_URL'];
//      print $cmd;           
      exec($cmd,$output);
//        print_r($output);
      return str_replace(array(' ',"\n"),'',join('',$output));
    }
    catch (Exception $e) {				// some error
      return "Error sending SMS: ".$e->getMessage();
    }									// -- sendSMS --
  }	  

}

?>

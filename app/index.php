<?php
header('Access-Control-Allow-Origin: http://localhost:5000');
header("Access-Control-Allow-Credentials: true");
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');
session_start();

require_once 'config/database.php';


if (function_exists('socket_create')) {
    echo "Sockets enabled!" . PHP_EOL;;
} else {
    echo "Still not enabled." . PHP_EOL;;
}

require 'vendor/autoload.php';

use CodingLibs\ZktecoPhp\Libs\ZKTeco;

// 1. Instantiate with device IP (and default port 4370)
$ip      = '10.10.80.8';
$port    = 4370;
$zk      = new ZKTeco($ip, $port);

// 2. Connect
if (! $zk->connect()) {
    die("Unable to connect to device at $ip:$port\n");
}
echo "Connected to ZKTeco device at $ip:$port\n";

// 3. Identify device
echo "Vendor:      " . $zk->vendorName()    . PHP_EOL;  // e.g. "ZKTeco Inc."
echo "Model:       " . $zk->deviceName()    . PHP_EOL;  // e.g. "F22/ID"
echo "Serial No.:  " . $zk->serialNumber()  . PHP_EOL;  // unique hardware serial
echo "Firmware:    " . $zk->version()       . PHP_EOL;  // e.g. "Ver 6.60 Sep 19 2019"
echo "Platform:    " . $zk->platform()      . PHP_EOL;  // e.g. "ZLM60_TFT"
echo "Current Time:" . $zk->getTime()       . PHP_EOL;  // device clock

// 2. Fetch all attendance logs
//    Returns an array of associative arrays with keys like:
//    ['uid' => (int) user ID, 'timestamp' => 'YYYY-MM-DD HH:MM:SS', 'status' => (int) event code, ...]
$logs = $zk->getAttendances();
// :contentReference[oaicite:0]{index=0}

$start = new DateTime('2025-04-01 00:00:00');
$end   = new DateTime('2025-04-30 23:59:59');

// Filter
$filtered = array_filter($logs, function($entry) use ($start, $end) {
    $t = new DateTime($entry['record_time']);
    return $t >= $start && $t <= $end;
});

// Re-index numerically
$filtered = array_values($filtered);

// Pretty-print as JSON
$prettyJSON = json_encode($filtered, JSON_PRETTY_PRINT);

echo '<pre>' . $prettyJSON . '</pre>';

/*
    $prettyJson = json_encode($logs, JSON_PRETTY_PRINT);

    // 2a. If you’re outputting to a browser, wrap it in <pre> so whitespace is preserved:
    echo '<pre>' . $prettyJson . '</pre>';

    // 2b. If you’re returning this from an API endpoint, send the correct header:
    header('Content-Type: application/json; charset=utf-8');
    echo $prettyJson;

*/


    // Example: print to screen
//    printf(
//        "User ID: %d  |  Time: %s  |  Status: %d\n",
//        $entry['uid'],
//        $entry['user_id'],
//        $entry['state']
//        $entry['record_time'],
//        $entry['type'],
//        $entry['device_ip']
//    );

    // Or insert into your database, e.g.:
    // $db->insert('attendance', [
    //     'user_id'    => $entry['uid'],
    //     'checked_at' => $entry['timestamp'],
    //     'status'     => $entry['status'],
    // ]);


// 4. Disconnect
$zk->disconnect();




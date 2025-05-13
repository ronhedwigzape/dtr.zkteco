<?php


/*
|-----------------------------------------------------------------------
| Database Configuration
|-----------------------------------------------------------------------
| Enter the configuration for your MySQL Database
|
|    host    ->  your config host
|    user    ->  your config username
|    pass    ->  your config password
|    dbname  ->  your config name
|    port    ->  your config port
|
*/

$config = [
    'host'   => 'localhost',
    'user'   => 'root',
    'pass'   => '',
    'dbname' => 'dtr.gvs',
    'port'   => 3306,
];

$conn = new mysqli($config['host'], $config['user'], $config['pass'], $config['dbname'], $config['port']);

if ($conn->connect_error) {
    die(json_encode([
        'error' => $conn->connect_error
    ]));
}
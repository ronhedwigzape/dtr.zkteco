<?php
header('Access-Control-Allow-Origin: http://localhost:5000');
header("Access-Control-Allow-Credentials: true");
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');
session_start();

require_once 'config/database.php';
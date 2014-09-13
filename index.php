<?
require_once('includes.php');
?>
<!DOCTYPE html>
<html>
	<head>
		<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
		<meta charset="utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge">
		<title>AlashowMusic </title>
		<link rel="stylesheet" href="<?=URL;?>css/bootstrap.css">
		 <link rel="stylesheet" href="css/jquery.ui.css">
		<link rel="stylesheet" href="<?=URL;?>css/style.css">
	</head>
	<body>
		<div class="navbar navbar-default navbar-fixed-top">
			<div class="container">
				<div class="navbar-header">
					<a  class="navbar-brand" onclick="window.scrollTo(0, 0);">AlashowMusic</a>
				</div>
			</div>
		</div>
		<div class="wrapper">
			<div class="container">
				<div class="col-xs-12">
					<div class="input-group">
						<input id="query" type="text" class="form-control" autofocus>
						<span class="input-group-btn">
						<button class="btn btn-primary search" type="button"><span class="glyphicon glyphicon-search"></span></button>
						</span>
					</div>
					
					<div id="result">
					<h2 id="loading" style="display:none" class="text-center"><span class="glyphicon glyphicon-refresh spin"></span></h2>
					<br>
						<div class="list-group">
							
						</div>
					</div>
				</div>
			</div>
		</div>
		<div id="footer">
			<div class="container">
				<p class="muted credit text-center">Powered By <a href="http://alashov.com" target="_blank">Alashov</a></p>
			</div>
		</div>
		<script src="<?=URL;?>js/jquery.js" type="text/javascript" charset="utf-8"></script>
		  <script src="//code.jquery.com/ui/1.11.1/jquery-ui.js"></script>
		<script src="<?=URL;?>js/app.js" type="text/javascript" charset="utf-8"></script>
	</body>
</html>
/* 	--------------------------------------------------------------------------------------------------------------
										CONNEXION TO WAVE LINK BY WEBSOCKET
	--------------------------------------------------------------------------------------------------------------*/
function update(deltaTime)
{
	if (statut == 0) {//si Wavelink repond on est connecté, on demande l'état des channels
		ID = 1;
		local.send('{"jsonrpc":"2.0","method":"getAllChannelInfo","id":'+ID+'}');
	}
}

function init()
{
	var ID = 0;
	var statut;
}
/*
hello pour json
		"Hello Wave Link": {
			"menu": "",
			"callback": "HelloWaveLink",
			"parameters": {
            },
		},
function HelloWaveLink() {
	ID ++;
	local.send('{"jsonrpc":"2.0","method":"getApplicationInfo","id":'+ID+'}');
}*/

function wsMessageReceived(data) { //check si WaveLink répond
	var connect = JSON.parse(data);
	if (connect.id == 1) {//si Wavelink repond on est connecté, on demande l'état des channels
	ID ++;
	local.send('{"jsonrpc":"2.0","method":"getAllChannelInfo","id":'+ID+'}');
	}
	else if (connect.id == 2) {//si Wavelink repond, on prend les données  
		statut = JSON.parse(data);
		//on converti les true et false
	var n = 0;
	while (statut['result'][n].bgColor != null) {
		var i = 0;
		while (statut['result'][n]['filters'][i].filterID != null) {
			if (statut['result'][n]['filters'][i].active == true){
				statut['result'][n]['filters'][i].active = "true";
			} else {statut['result'][n]['filters'][i].active = "false";}
			i++;
		}
		if (statut['result'][n].isAvailable == true){
			statut['result'][n].isAvailable = "true";
		} else {statut['result'][n].isAvailable = "false";}
		if (statut['result'][n].isLocalInMuted == true){
			statut['result'][n].isLocalInMuted = "true";
		} else {statut['result'][n].isLocalInMuted = "false";}
		if (statut['result'][n].isStreamInMuted == true){
			statut['result'][n].isStreamInMuted = "true";
		} else {statut['result'][n].isStreamInMuted = "false";}
		if (statut['result'][n].localMixFilterBypass == true){
			statut['result'][n].localMixFilterBypass = "true";
		} else {statut['result'][n].localMixFilterBypass = "false";}
		if (statut['result'][n].streamMixFilterBypass == true){
			statut['result'][n].streamMixFilterBypass = "true";
		} else {statut['result'][n].streamMixFilterBypass = "false";}
		n++;
	}
		//et on demande l'état communtateur
		ID ++;
		local.send('{"jsonrpc":"2.0","method":"getSwitchState","id":'+ID+'}');
	}
	else if (connect.id == 3) {//si Wavelink repond, on prend les données  et on demande l'état des moniteurs
	//ici il faut save tous les datas transmis
	ID ++;
	local.send('{"jsonrpc":"2.0","method":"getMonitoringState","id":'+ID+'}');
	}
	else if (connect.id == 4) {//si Wavelink repond, on prend les données 
	//ici il faut save tous les datas transmis
	}
};

/* 	--------------------------------------------------------------------------------------------------------------
										DIFFERENTS FUNCTIONS FOR SCRIPT
	--------------------------------------------------------------------------------------------------------------*/
function FiltersList(index) {
	var n = 0;
	var filters ="";
	while (statut['result'][index]['filters'][n].filterID != null) {
		if (n!=0){
			filters += ",";
		}
		filters += '{"active":'+statut['result'][index]['filters'][n].active+',"filterID":"'+statut['result'][index]['filters'][n].filterID+'","name":"'+statut['result'][index]['filters'][n].name+'","pluginID":"'+statut['result'][index]['filters'][n].pluginID+'"}';
	n++;	
	}
	return filters;
};

function setupEnumChannel(command) {
    var enumChan = command.addEnumParameter("Toggle channel", "");
	var enumTypVol = command.addEnumParameter("Type of volume", "");
	enumTypVol.addOption("Local mix","local");
	enumTypVol.addOption("Stream mix","stream");
	var index = 0;
	while (statut['result'][index].bgColor != null) {
		enumChan.addOption(statut['result'][index].mixerName,statut['result'][index].mixId);
		index++;
	}
 }

function setupToggleFilter(command) {
    var enumChan = command.addEnumParameter("Toggle channel", "");
	var enumFilt = command.addEnumParameter("Filter to toggle", "");
	var index = 0;
	var n = 0;
	while (statut['result'][index].bgColor != null) {
		while (statut['result'][index]['filters'][n].filterID != null) {
			var choice = statut['result'][index].mixerName+' - '+statut['result'][index]['filters'][n].name;
			enumFilt.addOption(choice,n);
			n++;
		}
		enumChan.addOption(statut['result'][index].mixerName,statut['result'][index].mixId);
		index++;
	}
 }

function Commande() {
	ID ++;
	//local.send
	script.log(local.parameters.connected.Boolean);
	if (local.parameters.connected == '[Connected : Boolean > 1]'){
		script.log('je suis connecté');
	}
	else {
		script.log('je suis out');
	}
}

/* 	--------------------------------------------------------------------------------------------------------------
										Fonction Set Volume
	--------------------------------------------------------------------------------------------------------------*/

function setVolume(Vol, idMix, Type) {
//1. trouver l'index du channel (mixID) vérifier si le son choisi est mute ou unmute et changer sa valeur
	var index;
	var n = 0;
	while (statut['result'][n].bgColor != null) {
		if (statut['result'][n].mixId == idMix && Type == "stream") {
			index = n;
			statut['result'][n].streamVolumeIn = Vol;
		}
		else if (statut['result'][n].mixId == idMix && Type == "local") { 
			index = n;
			statut['result'][n].localVolumeIn = Vol;
		}
	n++;
	};

//2. on envoi la commande
	ID ++;
	local.send('{"jsonrpc": "'+statut.jsonrpc+'","method":"setInputMixer","id":'+ID+',"params":{"mixId":"'+idMix+'","slider":"'+Type+'","localVolumeIn":'+statut['result'][index].localVolumeIn+',"isLocalInMuted":'+statut['result'][index].isLocalInMuted+',"streamVolumeIn":'+statut['result'][index].streamVolumeIn+',"isStreamInMuted":'+statut['result'][index].isStreamInMuted+',"filters":['+FiltersList(index)+'],"localMixFilterBypass":'+statut['result'][index].localMixFilterBypass+',"streamMixFilterBypass":'+statut['result'][index].streamMixFilterBypass+'}}');
	
}

/* 	--------------------------------------------------------------------------------------------------------------
										Fonction toggle mute source
	--------------------------------------------------------------------------------------------------------------*/

function toggleMuteVolume(idMix, Type) {
//1. trouver l'index du channel (mixID) vérifier si le son choisi est mute ou unmute et changer sa valeur
	var index;
	var n = 0;
	while (statut['result'][n].bgColor != null) {
		if (statut['result'][n].mixId == idMix && Type == "stream" && statut['result'][n].isStreamInMuted == "true") {
			index = n;
			statut['result'][n].isStreamInMuted = "false";
		}
		else if (statut['result'][n].mixId == idMix && Type == "stream" && statut['result'][n].isStreamInMuted == "false") { 
			index = n;
			statut['result'][n].isStreamInMuted = "true";
	}
		else if (statut['result'][n].mixId == idMix && Type == "local" && statut['result'][n].isLocalInMuted == "true") {
			index = n;
			statut['result'][n].isLocalInMuted = "false";
		}
		else if (statut['result'][n].mixId == idMix && Type == "local" && statut['result'][n].isLocalInMuted == "false") { 
			index = n;
			statut['result'][n].isLocalInMuted = "true";
	}
	n++;
	};

//2. on envoi la commande
	ID ++;
	local.send('{"jsonrpc": "'+statut.jsonrpc+'","method":"setInputMixer","id":'+ID+',"params":{"mixId":"'+idMix+'","slider":"'+Type+'","localVolumeIn":'+statut['result'][index].localVolumeIn+',"isLocalInMuted":'+statut['result'][index].isLocalInMuted+',"streamVolumeIn":'+statut['result'][index].streamVolumeIn+',"isStreamInMuted":'+statut['result'][index].isStreamInMuted+',"filters":['+FiltersList(index)+'],"localMixFilterBypass":'+statut['result'][index].localMixFilterBypass+',"streamMixFilterBypass":'+statut['result'][index].streamMixFilterBypass+'}}');
	
}

/* 	--------------------------------------------------------------------------------------------------------------
										Fonction toggle filter
	--------------------------------------------------------------------------------------------------------------*/
function toggleFilter(idMix, numFiltre) {
//1. trouver l'index du channel (mixID) vérifier si le filtre choisi est mute ou unmute et changer sa valeur
	var index;
	var n = 0;
	while (statut['result'][n].bgColor != null) {
		if (statut['result'][n].mixId == idMix && statut['result'][0]['filters'][numFiltre].active == "true") {
			index = n;
			statut['result'][n]['filters'][numFiltre].active = "false";
		}
		else if (statut['result'][n].mixId == idMix && statut['result'][0]['filters'][numFiltre].active == "false") { 
			index = n;
			statut['result'][n]['filters'][numFiltre].active = "true";
		}
		n++;
	}
	
//2. on envoi la commande
	ID ++;
	local.send('{"jsonrpc": "'+statut.jsonrpc+'","method":"setInputMixer","id":'+ID+',"params":{"mixId":"'+idMix+'","slider":"","localVolumeIn":'+statut['result'][index].localVolumeIn+',"isLocalInMuted":'+statut['result'][index].isLocalInMuted+',"streamVolumeIn":'+statut['result'][index].streamVolumeIn+',"isStreamInMuted":'+statut['result'][index].isStreamInMuted+',"filters":['+FiltersList(index)+'],"localMixFilterBypass":'+statut['result'][index].localMixFilterBypass+',"streamMixFilterBypass":'+statut['result'][index].streamMixFilterBypass+'}}');
};

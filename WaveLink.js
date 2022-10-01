/* 	--------------------------------------------------------------------------------------------------------------
										CONNEXION TO WAVE LINK BY WEBSOCKET
	--------------------------------------------------------------------------------------------------------------*/
function init()
{
	var ID = 0;
	var statut;
}
function HelloWaveLink() {
	ID ++;
	local.send('{"jsonrpc":"2.0","method":"getApplicationInfo","id":'+ID+'}');
}
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

function FiltersList(index) {
	var n = 0;
	var filters;
	while (statut['result'][index]['filters'][n].filterID != null) {
		filters += '{"active":'+statut['result'][index]['filters'][n].active+',"filterID":"'+statut['result'][index]['filters'][n].filterID+'","name":"'+statut['result'][index]['filters'][n].name+'","pluginID":"'+statut['result'][index]['filters'][n].pluginID+'"},';
	n++;	
	}
	return filters;
};

function Commande() {
	var index = 0;
	var n = 0;
	var filters;
	while (statut['result'][index]['filters'][n].filterID != null) {
		filters += '{"active":'+statut['result'][index]['filters'][n].active+',"filterID":"'+statut['result'][index]['filters'][n].filterID+'","name":"'+statut['result'][index]['filters'][n].name+'","pluginID":"'+statut['result'][index]['filters'][n].pluginID+'"},';
		script.log(n);
	n++;	
	}
	script.log(filters);
}

function sendObsRawJSONCommand(json) {
	local.send(json);
}

//A partir d'ici on peut envoyer des datas avec un id = 5
function sendWLCommand(req) {
	ID ++;
	script.log(JSON.stringify(send));
	local.send(JSON.stringify(send));
}

/* 	--------------------------------------------------------------------------------------------------------------
										Fonction Set Volume
	--------------------------------------------------------------------------------------------------------------*/

function setVolume(Channel, Type, Vol) {
//1. trouver mixId en fonction du channel choisi
	if (Channel == "waveMicro") {
		var idMix = "pcm_in_01_c_00_sd1";
	}
	else if (Channel == "System") { 
		var idMix = "pcm_out_01_v_00_sd2";
	}
	else if (Channel == "Music") { 
		var idMix = "pcm_out_01_v_02_sd3";
	}
	else if (Channel == "Browser") { 
		var idMix = "pcm_out_01_v_04_sd4";
	}
	else if (Channel == "voiceChat") { 
		var idMix = "pcm_out_01_v_06_sd5";
	}
	else if (Channel == "SFX") { 
		var idMix = "pcm_out_01_v_08_sd6";
	}
	else if (Channel == "Game") { 
		var idMix = "pcm_out_01_v_10_sd7";
	}
	else if (Channel == "AUX1") { 
		var idMix = "pcm_out_01_v_12_sd8";
	}
	else if (Channel == "AUX2") { 
		var idMix = "pcm_out_01_v_14_sd9";
	}

//2. trouver l'index du channel (mixID) vérifier si le son choisi est mute ou unmute et changer sa valeur
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

//3. on envoi la commande
	ID ++;
	//local.send
	local.send('{"jsonrpc": "'+statut.jsonrpc+'","method":"setInputMixer","id":'+ID+',"params":{"mixId":"'+idMix+'","slider":"'+Type+'","localVolumeIn":'+statut['result'][index].localVolumeIn+',"isLocalInMuted":'+statut['result'][index].isLocalInMuted+',"streamVolumeIn":'+statut['result'][index].streamVolumeIn+',"isStreamInMuted":'+statut['result'][index].isStreamInMuted+',"filters":[],"localMixFilterBypass":'+statut['result'][index].localMixFilterBypass+',"streamMixFilterBypass":'+statut['result'][index].streamMixFilterBypass+'}}');
	
}

/* 	--------------------------------------------------------------------------------------------------------------
										Fonction toggle mute source
	--------------------------------------------------------------------------------------------------------------*/

function toggleMuteVolume(Channel, Type) {
//1. trouver mixId en fonction du channel choisi
	if (Channel == "waveMicro") {
		var idMix = "pcm_in_01_c_00_sd1";
	}
	else if (Channel == "System") { 
		var idMix = "pcm_out_01_v_00_sd2";
	}
	else if (Channel == "Music") { 
		var idMix = "pcm_out_01_v_02_sd3";
	}
	else if (Channel == "Browser") { 
		var idMix = "pcm_out_01_v_04_sd4";
	}
	else if (Channel == "voiceChat") { 
		var idMix = "pcm_out_01_v_06_sd5";
	}
	else if (Channel == "SFX") { 
		var idMix = "pcm_out_01_v_08_sd6";
	}
	else if (Channel == "Game") { 
		var idMix = "pcm_out_01_v_10_sd7";
	}
	else if (Channel == "AUX1") { 
		var idMix = "pcm_out_01_v_12_sd8";
	}
	else if (Channel == "AUX2") { 
		var idMix = "pcm_out_01_v_14_sd9";
	}

//2. trouver l'index du channel (mixID) vérifier si le son choisi est mute ou unmute et changer sa valeur
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

//3. on envoi la commande
	ID ++;
	//local.send
	local.send('{"jsonrpc": "'+statut.jsonrpc+'","method":"setInputMixer","id":'+ID+',"params":{"mixId":"'+idMix+'","slider":"'+Type+'","localVolumeIn":'+statut['result'][index].localVolumeIn+',"isLocalInMuted":'+statut['result'][index].isLocalInMuted+',"streamVolumeIn":'+statut['result'][index].streamVolumeIn+',"isStreamInMuted":'+statut['result'][index].isStreamInMuted+',"filters":[],"localMixFilterBypass":'+statut['result'][index].localMixFilterBypass+',"streamMixFilterBypass":'+statut['result'][index].streamMixFilterBypass+'}}');
	
}

/* 	--------------------------------------------------------------------------------------------------------------
										Fonction toggle filter
	--------------------------------------------------------------------------------------------------------------*/

function toggleFilter(Channel, Filtre) {
	script.log(JSON.stringify(js));
	local.send(JSON.stringify(js));
}
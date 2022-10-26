var myFileParam = script.addFileParameter("File Param", "File to save all informations of WaveLink");
//local.scripts.waveLink.params.getChild("fileParam").setAttribute("readonly" ,true);
local.scripts.waveLink.params.getChild("fileParam").set("SaveWL.txt");
var statut;

function init()
{
	var ID = 0;
	statut = JSON.parse(myFileParam.readFile());
}

function moduleValueChanged(value) {
	if(value.name == "removeAllValues") {
		removeValues();
	}
	if(value.name == "saveInfoWL") {
		myFileParam.writeFile(statut, true);
		var path = myFileParam.getAbsolutePath();
        script.log('file written here : '+ path);
	}
}
/* 	--------------------------------------------------------------------------------------------------------------
										CONNEXION TO WAVE LINK BY WEBSOCKET
	--------------------------------------------------------------------------------------------------------------*/
function update()
{
	if (ID == 0) {//si Wavelink repond on est wlObjé, on demande l'état des channels
		ID = 1;
		local.send('{"jsonrpc":"2.0","method":"getAllChannelInfo","id":'+ID+'}');
	}
	if (local.parameters.connected == false){
		ID = 0;
	}
}

function wsMessageReceived(data) { //check si WaveLink répond
	var wlObj = JSON.parse(data);
	if (wlObj.id == 1) {//si Wavelink repond on est wlObjé, on demande l'état des channels
		ID ++;
		local.send('{"jsonrpc":"2.0","method":"getAllChannelInfo","id":'+ID+'}');
	}
	else if (wlObj.id == 2) {//si Wavelink repond, on prend les données  
		statut = JSON.parse(data);
	//on supprime les anciennes valeurs
		removeValues();
	//on enumère pour jouer avec les datas
		n = 0;
		while (statut['result'][n].bgColor != null) {	
		//on enregistre les nouvelles données des channels (mixer name et mix id) dans les values
			local.values.addContainer("AudioChannel"+n);
			local.values.getChild("AudioChannel"+n).addStringParameter("Mixer name","", statut['result'][n].mixerName);
			local.values.getChild("AudioChannel"+n).getChild("mixerName").setAttribute("readonly" ,true);
			local.values.getChild("AudioChannel"+n).addStringParameter("Mix ID","", statut['result'][n].mixId);
			local.values.getChild("AudioChannel"+n).getChild("mixId").setAttribute("readonly" ,true);
			local.values.getChild("AudioChannel"+n).addBoolParameter("Stream muted","To know if the stream audio channel's is muted or not",statut['result'][n].isStreamInMuted);
			local.values.getChild("AudioChannel"+n).getChild("streamMuted").setAttribute("readonly" ,true);
			local.values.getChild("AudioChannel"+n).addFloatParameter("Stream volume","The level of stream volume of this channel",statut['result'][n].streamVolumeIn,0,100);
			local.values.getChild("AudioChannel"+n).getChild("streamVolume").setAttribute("readonly" ,true);
			local.values.getChild("AudioChannel"+n).addBoolParameter("Local muted","To know if the local audio channel's is muted or not",statut['result'][n].isLocalInMuted);
			local.values.getChild("AudioChannel"+n).getChild("localMuted").setAttribute("readonly" ,true);
			local.values.getChild("AudioChannel"+n).addFloatParameter("Local volume","The level of local volume of this channel",statut['result'][n].localVolumeIn,0,100);
			local.values.getChild("AudioChannel"+n).getChild("localVolume").setAttribute("readonly" ,true);
			
		//on converti les true et false
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
			
		//on enregistre les nouvelles données des filtres des channels 
			local.values.getChild("AudioChannel"+n).addFloatParameter("Filters number","",0);
			local.values.getChild("AudioChannel"+n).getChild("filtersNumber").setAttribute("readonly" ,true);
			var i = 0;
			while (statut['result'][n]['filters'][i].filterID != null) {
			//On enregistre les données des filtres dans values
				local.values.getChild("AudioChannel"+n).addContainer("Filters");
				local.values.getChild("AudioChannel"+n).getChild("Filters").addStringParameter("Filter name "+i,"", statut['result'][n]['filters'][i].name);
				local.values.getChild("AudioChannel"+n).getChild("Filters").getChild("filterName"+i).setAttribute("readonly" ,true);
				local.values.getChild("AudioChannel"+n).getChild("Filters").addBoolParameter("Filter name "+i+" active","To know if this filter is activate or not",statut['result'][n]['filters'][i].active);
				local.values.getChild("AudioChannel"+n).getChild("Filters").getChild("filterName"+i+"active").setAttribute("readonly" ,true);
			//On change les true et false en texte
				if (statut['result'][n]['filters'][i].active == true){
					statut['result'][n]['filters'][i].active = "true";
				} else {statut['result'][n]['filters'][i].active = "false";}
			//On enregistre la nouvelle valeur du nombre de filtres
				i++;
				local.values.getChild("AudioChannel"+n).getChild("filtersNumber").set(i);
			}
			n++;
		}
	//on enregistre le nombre de channel max
	local.values.getChild("AudioChannelNumber").set(n);
	local.values.saveInfoWL.trigger();
	//et on demande l'état communtateur
	ID ++;
	local.send('{"jsonrpc":"2.0","method":"getSwitchState","id":'+ID+'}');
	}
	else if (wlObj.id == 3) {//si Wavelink repond, on prend les données  et on demande l'état des moniteurs
	ID ++;
	local.send('{"jsonrpc":"2.0","method":"getMonitoringState","id":'+ID+'}');
	}
	else if (wlObj.id == 4) {//si Wavelink repond, on prend les données 

	}
};

/* 	--------------------------------------------------------------------------------------------------------------
										DIFFERENTS FUNCTIONS FOR SCRIPT
	--------------------------------------------------------------------------------------------------------------*/
function removeValues () {
		var n = 0;
		while ( n < 10) {
			local.values.removeContainer("AudioChannel"+n);
			n++;
		}
		local.values.getChild("AudioChannelNumber").set(0);
};
	
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
	var path = local.scripts.waveLink.params.getChild("fileParam").getAbsolutePath();
	script.log("path :"+path);
}
/* 	--------------------------------------------------------------------------------------------------------------
											Set Volume
	--------------------------------------------------------------------------------------------------------------*/

function setVolume(Vol, idMix, Type) {
//1. trouver l'index du channel (mixID) vérifier si le son choisi est mute ou unmute et changer sa valeur
	var index;
	var n = 0;
	while (statut['result'][n].bgColor != null) {
		if (statut['result'][n].mixId == idMix && Type == "stream") {
			index = n;
			statut['result'][n].streamVolumeIn = Vol;
			local.values.getChild("AudioChannel"+n).getChild("streamVolume").set(Vol);
		}
		else if (statut['result'][n].mixId == idMix && Type == "local") { 
			index = n;
			statut['result'][n].localVolumeIn = Vol;
			local.values.getChild("AudioChannel"+n).getChild("localVolume").set(Vol);
		}
	n++;
	};

//2. on sauvegarde les nouveaux paramètres et on envoi la commande
	local.values.saveInfoWL.trigger();
	ID ++;
	local.send('{"jsonrpc": "'+statut.jsonrpc+'","method":"setInputMixer","id":'+ID+',"params":{"mixId":"'+idMix+'","slider":"'+Type+'","localVolumeIn":'+statut['result'][index].localVolumeIn+',"isLocalInMuted":'+statut['result'][index].isLocalInMuted+',"streamVolumeIn":'+statut['result'][index].streamVolumeIn+',"isStreamInMuted":'+statut['result'][index].isStreamInMuted+',"filters":['+FiltersList(index)+'],"localMixFilterBypass":'+statut['result'][index].localMixFilterBypass+',"streamMixFilterBypass":'+statut['result'][index].streamMixFilterBypass+'}}');
	
}

/* 	--------------------------------------------------------------------------------------------------------------
											toggle mute source
	--------------------------------------------------------------------------------------------------------------*/

function toggleMuteVolume(idMix, Type) {
//1. trouver l'index du channel (mixID) vérifier si le son choisi est mute ou unmute et changer sa valeur
	var index;
	var n = 0;
	while (statut['result'][n].bgColor != null) {
		if (statut['result'][n].mixId == idMix && Type == "stream" && statut['result'][n].isStreamInMuted == "true") {
			index = n;
			statut['result'][n].isStreamInMuted = "false";
			local.values.getChild("AudioChannel"+n).getChild("streamMuted").set(false);
		}
		else if (statut['result'][n].mixId == idMix && Type == "stream" && statut['result'][n].isStreamInMuted == "false") { 
			index = n;
			statut['result'][n].isStreamInMuted = "true";
			local.values.getChild("AudioChannel"+n).getChild("streamMuted").set(true);
	}
		else if (statut['result'][n].mixId == idMix && Type == "local" && statut['result'][n].isLocalInMuted == "true") {
			index = n;
			statut['result'][n].isLocalInMuted = "false";
			local.values.getChild("AudioChannel"+n).getChild("localMuted").set(false);
		}
		else if (statut['result'][n].mixId == idMix && Type == "local" && statut['result'][n].isLocalInMuted == "false") { 
			index = n;
			statut['result'][n].isLocalInMuted = "true";
			local.values.getChild("AudioChannel"+n).getChild("localMuted").set(true);
	}
	n++;
	};

//2. On sauvegarde les nouveaux paramètres et on envoi la commande
	local.values.saveInfoWL.trigger();
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
			local.values.getChild("AudioChannel"+n).getChild("Filters").getChild("filterName"+numFiltre+"Active").set(false);
		}
		else if (statut['result'][n].mixId == idMix && statut['result'][0]['filters'][numFiltre].active == "false") { 
			index = n;
			statut['result'][n]['filters'][numFiltre].active = "true";
			local.values.getChild("AudioChannel"+n).getChild("Filters").getChild("filterName"+numFiltre+"Active").set(true);
		}
		n++;
	}
	
//2. On sauvegarde les nouveaux paramètres et on envoi la commande
	local.values.saveInfoWL.trigger();
	ID ++;
	local.send('{"jsonrpc": "'+statut.jsonrpc+'","method":"setInputMixer","id":'+ID+',"params":{"mixId":"'+idMix+'","slider":"","localVolumeIn":'+statut['result'][index].localVolumeIn+',"isLocalInMuted":'+statut['result'][index].isLocalInMuted+',"streamVolumeIn":'+statut['result'][index].streamVolumeIn+',"isStreamInMuted":'+statut['result'][index].isStreamInMuted+',"filters":['+FiltersList(index)+'],"localMixFilterBypass":'+statut['result'][index].localMixFilterBypass+',"streamMixFilterBypass":'+statut['result'][index].streamMixFilterBypass+'}}');
};

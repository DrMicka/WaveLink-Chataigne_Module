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
	if (ID == 0) {//si Wavelink repond, on demande l'état des channels
		ID = 1;
		local.send('{"jsonrpc":"2.0","method":"getApplicationInfo","id":'+ID+'}');
	}
	if (local.parameters.connected == false){
		ID = 0;
	}
}

function wsMessageReceived(data) { //check si WaveLink répond
	var wlObj = JSON.parse(data);
	if (wlObj.id == 1) {//si Wavelink repond, on demande l'état du micro
		ID ++;
		local.send('{"jsonrpc":"2.0","method":"getMicrophoneConfig","id":'+ID+'}');
	}
	else if (wlObj.id == 2) {//si Wavelink repond, on demande l'état des channels
		ID ++;
		local.send('{"jsonrpc":"2.0","method":"getOutputs","id":'+ID+'}');
	}
	else if (wlObj.id == 3) {//si Wavelink repond, on demande l'état des channels
		ID ++;
		local.send('{"jsonrpc":"2.0","method":"getOutputConfig","id":'+ID+'}');
	}
	else if (wlObj.id == 4) {//si Wavelink repond, on demande l'état des channels
		ID ++;
		local.send('{"jsonrpc":"2.0","method":"getInputConfigs","id":'+ID+'}');
	}	
	else if (wlObj.id == 5) {//si Wavelink repond, on prend les données  
		statut = JSON.parse(data);
	//on supprime les anciennes valeurs
		removeValues();
	//on enumère pour jouer avec les datas
		n = 0;
		while (statut['result'][n].bgColor != null) {	
		//on enregistre les nouvelles données des channels (mixer name et mix id) dans les values
			local.values.addContainer("AudioChannel"+n);
			local.values.getChild("AudioChannel"+n).addStringParameter("Mixer name","", statut['result'][n].name);
			local.values.getChild("AudioChannel"+n).getChild("mixerName").setAttribute("readonly" ,true);
			local.values.getChild("AudioChannel"+n).addStringParameter("Identifier","", statut['result'][n].identifier);
			local.values.getChild("AudioChannel"+n).getChild("identifier").setAttribute("readonly" ,true);
			local.values.getChild("AudioChannel"+n).addBoolParameter("Stream muted","To know if the stream audio channel's is muted or not",statut['result'][n]['streamMixer'][0]);
			local.values.getChild("AudioChannel"+n).getChild("streamMuted").setAttribute("readonly" ,true);
			local.values.getChild("AudioChannel"+n).addFloatParameter("Stream volume","The level of stream volume of this channel",statut['result'][n]['streamMixer'][1],0,100);
			local.values.getChild("AudioChannel"+n).getChild("streamVolume").setAttribute("readonly" ,true);
			local.values.getChild("AudioChannel"+n).addBoolParameter("Local muted","To know if the local audio channel's is muted or not",statut['result'][n]['localMixer'][0]);
			local.values.getChild("AudioChannel"+n).getChild("localMuted").setAttribute("readonly" ,true);
			local.values.getChild("AudioChannel"+n).addFloatParameter("Local volume","The level of local volume of this channel",statut['result'][n]['localMixer'][1],0,100);
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
			if (statut['result'][n]['streamMixer'][0] == true){
				statut['result'][n]['streamMixer'][0] = "true";
			} else {statut['result'][n]['streamMixer'][0] = "false";}
			if (statut['result'][n]['streamMixer'][2] == true){
				statut['result'][n]['streamMixer'][2] = "true";
			} else {statut['result'][n]['streamMixer'][2] = "false";}
			if (statut['result'][n]['localMixer'][0] == true){
				statut['result'][n]['localMixer'][0] = "true";
			} else {statut['result'][n]['localMixer'][0] = "false";}
			if (statut['result'][n]['localMixer'][2] == true){
				statut['result'][n]['localMixer'][2] = "true";
			} else {statut['result'][n]['localMixer'][2] = "false";}
			
		//on enregistre les nouvelles données des filtres des channels 
			local.values.getChild("AudioChannel"+n).addFloatParameter("Filters number","",0);
			local.values.getChild("AudioChannel"+n).getChild("filtersNumber").setAttribute("readonly" ,true);
			var i = 0;
			while (statut['result'][n]['filters'][i].filterID != null) {
			//On enregistre les données des filtres dans values
				local.values.getChild("AudioChannel"+n).addContainer("Filters");
				local.values.getChild("AudioChannel"+n).getChild("Filters").addStringParameter("Filter name "+i,"", statut['result'][n]['filters'][i].name);
				local.values.getChild("AudioChannel"+n).getChild("Filters").getChild("filterName"+i).setAttribute("readonly" ,true);
				local.values.getChild("AudioChannel"+n).getChild("Filters").addBoolParameter("Filter name "+i+" active","To know if this filter is activate or not",statut['result'][n]['filters'][i].isActive);
				local.values.getChild("AudioChannel"+n).getChild("Filters").getChild("filterName"+i+"active").setAttribute("readonly" ,true);
			//On change les true et false en texte
				if (statut['result'][n]['filters'][i].isActive == true){
					statut['result'][n]['filters'][i].isActive = "true";
				} else {statut['result'][n]['filters'][i].isActive = "false";}
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
	else if (wlObj.id == 6) {//si Wavelink repond, on prend les données  et on demande l'état des moniteurs

	}
/* 	--------------------------------------------------------------------------------------------------------------
										Interpretation of the answer after the request
	--------------------------------------------------------------------------------------------------------------*/
	//set volume
	else if (wlObj.method == "inputVolumeChanged") {//si Wavelink repond, on prend les données  et on demande l'état des moniteurs
		var n = 0;
		while (statut['result'][n].bgColor != null) {
			if (statut['result'][n].identifier == wlObj.params.identifier && wlObj.params.mixerID == "com.elgato.mix.stream") {
				statut['result'][n]['streamMixer'][1] = wlObj.params.value;
				local.values.getChild("AudioChannel"+n).getChild("streamVolume").set(wlObj.params.value);
			}
			else if (statut['result'][n].identifier == wlObj.params.identifier && wlObj.params.mixerID == "com.elgato.mix.local") { 
				statut['result'][n]['localMixer'][1] = wlObj.params.value;
				local.values.getChild("AudioChannel"+n).getChild("localVolume").set(wlObj.params.value);
			}
		n++;
		};
		local.values.saveInfoWL.trigger();
	}
	
	//toggle mute volume
	else if (wlObj.method == "inputMuteChanged") {//si Wavelink repond, on prend les données  et on demande l'état des moniteurs
		var n = 0;
		while (statut['result'][n].bgColor != null) {
			if (statut['result'][n].identifier == wlObj.params.identifier && wlObj.params.mixerID == "com.elgato.mix.stream" && wlObj.params.value == true) {
				statut['result'][n]['streamMixer'][0] = "true";
				local.values.getChild("AudioChannel"+n).getChild("streamMuted").set(true);
			}
			else if (statut['result'][n].identifier == wlObj.params.identifier && wlObj.params.mixerID == "com.elgato.mix.stream" && wlObj.params.value == false) { 
				statut['result'][n]['streamMixer'][0] = "false";
				local.values.getChild("AudioChannel"+n).getChild("streamMuted").set(false);
		}
			else if (statut['result'][n].identifier == wlObj.params.identifier && wlObj.params.mixerID == "com.elgato.mix.local" && wlObj.params.value == true) {
				statut['result'][n]['localMixer'][0] = "true";
				local.values.getChild("AudioChannel"+n).getChild("localMuted").set(true);
			}
			else if (statut['result'][n].identifier == wlObj.params.identifier && wlObj.params.mixerID == "com.elgato.mix.local" && wlObj.params.value == false) { 
				statut['result'][n]['localMixer'][0] = "false";
				local.values.getChild("AudioChannel"+n).getChild("localMuted").set(false);
		}
		n++;
		};
		local.values.saveInfoWL.trigger();
	}
	
	//Toggle filter
	else if (wlObj.method == "filterChanged") {//si Wavelink repond, on prend les données  et on demande l'état des moniteurs
		var n = 0;
		var index = 0;
		while (statut['result'][n].bgColor != null) {
			if (statut['result'][n].identifier == wlObj.params.identifier){
				while (statut['result'][n]['filters'][index].filterID != null) {
					if (statut['result'][n]['filters'][index].filterID == wlObj.params.filterID && wlObj.params.value == true){
						statut['result'][n]['filters'][index].isActive = "true";
						local.values.getChild("AudioChannel"+n).getChild("Filters").getChild("filterName"+index+"Active").set(true);	
					}
					else if (statut['result'][n]['filters'][index].filterID == wlObj.params.filterID && wlObj.params.value == false){
						statut['result'][n]['filters'][index].isActive = "false";
						local.values.getChild("AudioChannel"+n).getChild("Filters").getChild("filterName"+index+"Active").set(false);	
					}
				index++;
				}
			}
			n++;
		}		
		local.values.saveInfoWL.trigger();
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

function setupEnumChannel(command) {
    var enumChan = command.addEnumParameter("Toggle channel", "");
	var enumTypVol = command.addEnumParameter("Type of volume", "");
	enumTypVol.addOption("Local mix","com.elgato.mix.local");
	enumTypVol.addOption("Stream mix","com.elgato.mix.stream");
	var index = 0;
	while (statut['result'][index].bgColor != null) {
		enumChan.addOption(statut['result'][index].name,statut['result'][index].identifier);
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
			var choice = statut['result'][index].name+' - '+statut['result'][index]['filters'][n].name;
			enumFilt.addOption(choice,n);
			n++;
		}
		enumChan.addOption(statut['result'][index].name,statut['result'][index].identifier);
		index++;
	}
 }

function Commande(data) {
	local.send(data);
}
/* 	--------------------------------------------------------------------------------------------------------------
											Set Volume
	--------------------------------------------------------------------------------------------------------------*/

function setVolume(Vol, identifier, Type) {
//1. trouver l'index du channel (identifier)
	var index;
	var n = 0;
	while (statut['result'][n].bgColor != null) {
		if (statut['result'][n].identifier == identifier && Type == "com.elgato.mix.stream") {
			index = n;
		}
		else if (statut['result'][n].identifier == identifier && Type == "com.elgato.mix.local") { 
			index = n;
		}
	n++;
	};

//2. on envoi la commande
	ID ++;
	local.send('{"jsonrpc": "2.0","method": "setInputConfig","id": '+ID+',"params": {"property": "Volume","identifier": '+JSON.stringify(statut['result'][index].identifier)+',"mixerID": '+JSON.stringify(Type)+',"value": '+Vol+',"forceLink": false}}');
}

/* 	--------------------------------------------------------------------------------------------------------------
											toggle mute source
	--------------------------------------------------------------------------------------------------------------*/

function toggleMuteVolume(identifier, Type) {
//1. trouver l'index du channel (identifier) vérifier si le son choisi est mute ou unmute et changer sa valeur
	var index;
	var n = 0;
	while (statut['result'][n].bgColor != null) {
		if (statut['result'][n].identifier == identifier && Type == "com.elgato.mix.stream" && statut['result'][n]['streamMixer'][0] == "true") {
			index = n;
			var value = "false";
		}
		else if (statut['result'][n].identifier == identifier && Type == "com.elgato.mix.stream" && statut['result'][n]['streamMixer'][0] == "false") { 
			index = n;
			var value = "true";
		}
		else if (statut['result'][n].identifier == identifier && Type == "com.elgato.mix.local" && statut['result'][n]['localMixer'][0] == "true") {
			index = n;
			var value = "false";
		}
		else if (statut['result'][n].identifier == identifier && Type == "com.elgato.mix.local" && statut['result'][n]['localMixer'][0] == "false") { 
			index = n;
			var value = "true";
		}
	n++;
	};

//2. On sauvegarde les nouveaux paramètres et on envoi la commande
	ID ++;
	local.send('{"jsonrpc": "2.0","method": "setInputConfig","id": '+ID+',"params": {"property": "Mute","identifier": '+JSON.stringify(statut['result'][index].identifier)+',"mixerID": '+JSON.stringify(Type)+',"value": '+value+',"forceLink": false}}');
}

/* 	--------------------------------------------------------------------------------------------------------------
										Fonction toggle filter
	--------------------------------------------------------------------------------------------------------------*/
function toggleFilter(identifier, numFiltre) {
//1. trouver l'index du channel (identifier) vérifier si le filtre choisi est mute ou unmute et changer sa valeur
	var index;
	var n = 0;
	while (statut['result'][n].bgColor != null) {
		if (statut['result'][n].identifier == identifier && statut['result'][n]['filters'][numFiltre].isActive == "true") {
			index = n;
			var value = "false";
		}
		else if (statut['result'][n].identifier == identifier && statut['result'][n]['filters'][numFiltre].isActive == "false") { 
			index = n;
			var value = "true";
		}
		n++;
	}
	
//2. On sauvegarde les nouveaux paramètres et on envoi la commande
	ID ++;
	local.send('{"jsonrpc": "2.0","method": "setFilter","id": '+ID+',"params": {"identifier": '+JSON.stringify(statut['result'][index].identifier)+',"filterID":"'+statut['result'][index]['filters'][numFiltre].filterID+'","value": '+value+'}}');
};

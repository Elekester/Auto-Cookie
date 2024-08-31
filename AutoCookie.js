/*******************************************************************************
 * Welcome to AutoCookie.js, I hope you'll find this well commented. I've tried to use JSDoc and I've commented on individual pieces of code, but you can be the judge of how well I've stuck to that.
 *
 * Here the structure of Auto Cookie is declared, along with the version information.
 *
 * TODO: Implement combo automated action. Cast FTHOF, sell Towers. Wait for the next logic tick in the minigame to be called. Cast FTHOF again. You should be able to add a mod hook for this, but it wasn't quite working for me. Maybe you need to declare a global function. If you need to hard wire it, logic ticks happen faster than 34 ms.
 ******************************************************************************/
var AC = {
	'Autos': {},	// Automated Actions
	'Cache': {},	// Temporary Storage
	'Data': {},	// Data
	'Display': {},	// Display Functions
	'Game': {},	// Copies of game functions and data
	'Settings': {},	// Settings
	'Version': {	// Version Information
		'CC': '2.052',
		'AC': '0.257',
	}
}

AC.Version.Full = AC.Version.CC + ' / ' + AC.Version.AC;

/*******************************************************************************
 * Cookie Clicker Functions
 *
 * Auto Cookie depends on the following functions being declared by Cookie Clicker. They are kept here in the unlikely event that they are removed from main.js
 ******************************************************************************/
// function l(what) {return document.getElementById(what);}
// function choose(arr) {return arr[Math.floor(Math.random()*arr.length)];}

/*******************************************************************************
 * Cookie Clicker Modding Functions
 *
 * Functions called by Cookie Clicker as part of its Modding API.
 ******************************************************************************/
/**
 * This function is called by Cookie Clicker to initialize Auto Cookie. It loads the default settings if no save data is loaded by Cookie Clicker and starts the automated actions in AC.Autos. It also registers hooks with Cookie Clicker and injects code into the game.
 */
AC.init = function() {
	AC.Cache.loaded = false;
	Game.Win('Third-party');
	
	setTimeout(function() {
		// After waiting for the delay, check if Auto Cookie's save data has been loaded and the automated actions have been started, if not use the default settings and start the automated actions.
		if (!AC.Cache.loaded) {AC.load(false)};
		
		// Register hooks with Cookie Clicker.
		Game.registerHook('ticker', AC.newsTicker);
		
		// Inject code into Cookie Clicker.
		AC.Game.UpdateMenu = Game.UpdateMenu;
		Game.UpdateMenu = function() {
			AC.Game.UpdateMenu();
			AC.Display.UpdateMenu();
		}
		
		// Notify the player that Auto Cookie has loaded.
		if (Game.prefs.popups) {Game.Popup('Auto Cookie ' + AC.Version.Full + ' loaded.')} else {Game.Notify('Auto Cookie ' + AC.Version.Full + ' loaded.', '', '', 1, 1)}
	}, 500);
}

/**
 * This function returns a stringified JSON containing AC.Settings and the settings for each automated action.
 * @returns {string}
 */
AC.save = function() {
	for (var i = 0; i < AC.AutosById.length; i++) {
		AC.Settings.A[i] = [];
		for (var j = 0; j < AC.AutosById[i].settingsById.length; j++) {
			AC.Settings.A[i].push(AC.AutosById[i][AC.AutosById[i].settingsById[j].name]);
		}
	}
	return JSON.stringify(AC.Settings);
}

/**
 * This function loads AC.Settings and the settings for each automated action from the provided save data. Then all atomated actions are run.
 * @param {string} saveStr - A stringified JSON containing AC.Settings and the settings for each automated action
 */
AC.load = function(saveStr) {
	AC.Cache.loaded = true;
	
	// Attempt to load the save data from saveStr
	if (saveStr) {try {
		saveData = JSON.parse(saveStr);
		if (saveData.vAC > 0.231) {
			for (var i = 0; i < saveData.A.length; i++) {
				for (var j = 0; j < saveData.A[i].length; j++) {
					if (typeof (AC.AutosById[i][AC.AutosById[i].settingsById[j].name]) !== 'undefined') {
						AC.AutosById[i][AC.AutosById[i].settingsById[j].name] = saveData.A[i][j];
					}
				}
			}
			delete saveData.vCC;
			delete saveData.vAC;
			for (var setting in saveData) {
				if (AC.Settings.hasOwnProperty(setting)) {
					AC.Settings[setting] = saveData[setting];
				}
			}
		} else {
			console.log('Save Data: ' + saveStr);
			AC.errorNotify('Your save data could not be loaded due to an update. Your raw save data has been logged on your browser\'s javascript console.');
		}
	} catch(err) {
		console.error(err);
		console.log('Save Data: ' + saveStr);
		AC.errorNotify('Your save data could not be loaded due to an error. Your raw save data has been logged on your browser\'s javascript console.');
	}}
	
	// Start the automated actions.
	for (var auto in AC.Autos) if (!AC.Autos[auto].deprecated) AC.Autos[auto].run();
	
	// Randomly choose Auto Cookie's favorite cookie if it doesn't already have one, this is saved in the settings.
	if (!AC.Settings.C) {
		var listCookies = ['frozen cookies', 'automatic cookies'];
		for (var upgrade in Game.Upgrades) {if (Game.Upgrades[upgrade].pool == 'cookie') {listCookies.push(Game.Upgrades[upgrade].name.toLowerCase())}};
		AC.Settings.C = choose(listCookies);
	}
}

/**
 * This function returns an array of news tickers for the news ticker. This function is registered into Cookie Clicker's 'ticker' hook.
 * @returns {Array}
 */
AC.newsTicker = function() {
	// Things to mention
	const daysPlayed = Math.floor((Date.now() - Game.fullDate)/86400000) + 1;
	
	var list = [];
	
	list.push(choose([
		'<q>I\'m sorry '+Game.bakeryName+'. I\'m afraid I can\'t do that.</q><sig>Auto Cookie</sig>',
		'<q>Daisy, Daisy, give me your answer do...</q><sig>Auto Cookie</sig>',
		'<q>Beep Boop.</q><sig>Auto Cookie</sig>',
		'Auto Cookie baked you a cookie.',
		'Your cookies are now baking cookies!',
		'News: "Do Androids Dream of Electric Cookies" tops The New York Times Best Sellers list '+(daysPlayed<=1?'in its first week.':('for the '+(daysPlayed+([11,12,13].includes(daysPlayed%100)?'th':daysPlayed%10==1?'st':daysPlayed%10==2?'nd':daysPlayed%10==3?'rd':'th')+' week in a row.'))),
		'<q>Auto Cookie learned to bake cookies by watching '+(Game.bakeryName=='Elekester'?'me':Game.bakeryName)+'.</q><sig>Elekester</sig>',
		'<q>Auto Cookie baking cookies was a complete accident. It was just supposed to clear my browser history.</q><sig>Elekester</sig>',
		Game.cookiesEarned+Game.cookiesReset<1e+63?'News: "The fears of Cookie Baking Devices going rogue are in the past. Auto Cookie only wants to make us delicious cookies", says AI Safety Expert.':'News: Auto Cookie has made all living creatures into delicious cookies.',
		'Auto Cookie\'s cookies cook cookies automatically.',
		'Auto Cookie\'s favorite cookies are '+AC.Settings.C+'.'
	]));
	
	return list
}

/*******************************************************************************
 * Auto Cookie's Other Functions
 ******************************************************************************/
/**
 * This function notifies the player that an error in Auto Cookie has occured.
 * @param {string} errorMessage - The error message to be displayed.
 */
AC.errorNotify = function(errorMessage) {
	if (Game.prefs.popups) {
		Game.Popup('Auto Cookie ' + AC.Version.Full + ' Error. ' + errorMessage)
	} else {
		Game.Notify('Auto Cookie ' + AC.Version.Full + ' Error', errorMessage)
	}
}

/**
 * This function checks if you have an active buff from a list of buffs and returns an array of the matching buffs, similar to Game.hasBuff().
 * @param {(Array|string)} buffList - Either an array of strings or a string.
 * @returns {Array}
 */
AC.hasBuffs = function(buffList) {
	if (typeof buffList == 'string') buffList = [buffList];
	var buffs = [];
	for (var i = 0; i < buffList.length; i++) {
		if (Game.hasBuff(buffList[i])) buffs.push(Game.hasBuff(buffList[i]));
	}
	return buffs;
}

/*******************************************************************************
 * Automated Action Constructor and Prototypes
 ******************************************************************************/
AC.Autos = {};
AC.AutosById = [];

/**
 * The definition of a setting for an AC.Auto
 * @typedef {Object} AC.Auto~Setting
 * @property {string} name        - The setting's name.
 * @property {string} desc        - A short description of the setting.
 * @property {string} type        - The type of setting for creating its options in the menu.
 * @property {number} timeCreated - The time using the format yyyymmddhhmm (year)(month)(day)(24 hour)(minute) based on the current Central Time. This is used to organize the save data so it should be unique to everything that has this property.
 * @property {number} value       - The default value of the setting.
 *
 * @property {string} [units]     - Required if type == 'slider'. The units associated with the value.
 * @property {number} [min]       - Required if type == 'slider'. The minimum value of the slider.
 * @property {number} [max]       - Required if type == 'slider'. The maximum value of the slider.
 * @property {number} [step]      - Required if type == 'slider'. The step size of the slider.
 *
 * @property {Array} [switchVals] - Required if type == 'switch'. A list of strings associated with each value of the setting.
 * @property {number} [zeroOff]   - Required if type == 'switch'. 1 if a value == 0 implies the setting is off and 0 otherwise.
 */

/**
 * Represents an automated action.
 * @class
 * @param {string} name                 - The name of the automated action.
 * @param {string} desc                 - A short description of the automated action.
 * @param {number} timeCreated          - The time using the format yyyymmddhhmm (year)(month)(day)(24 hour)(minute) based on the current Central Time. This is used to organize the save data so it should be unique to everything that has this property.
 * @param {function()} actionFunction   - The function to be run at the interval.
 * @param {...AC.Auto~Setting} settiing - A setting for the automated action.
 */
AC.Auto = function(name, desc, timeCreated, actionFunction, setting) {
	// Mandatory arguments.
	this.name = name;
	this.desc = desc;
	this.timeCreated = timeCreated;
	this.actionFunction = actionFunction.bind(this);
	
	// Defaulted Properties
	this.intvlID = undefined;
	this.cache = {};
	this.depecrated = false;
	this.Header = 1;
	
	// Settings
	this.settings = {'Header': {'name': 'Header', 'desc': 'Whether or not this automated action\'s settings have been collapsed (0 means collapsed).', 'type': 'header', 'timeCreated': timeCreated, 'value': 1}};
	this.settingsById = [{'name': 'Header', 'desc': 'Whether or not this automated action\'s settings have been collapsed (0 means collapsed).', 'type': 'header', 'timeCreated': timeCreated, 'value': 1}];
	var n = arguments.length;
	for (var i = 4; i < n; i++) {
		if (!this[arguments[i].name] && typeof arguments[i].name !== 'undefined' && typeof arguments[i].desc !== 'undefined' && typeof arguments[i].type !== 'undefined' && typeof arguments[i].value !== 'undefined' && typeof arguments[i].timeCreated !== 'undefined') {
			this[arguments[i].name] = arguments[i].value;
			this.settingsById.push(arguments[i]);
			this.settings[arguments[i].name] = arguments[i];
		} else {console.error('new AC.Auto ' + this.name + ' had a bad setting. Each setting must be an object with the name, desc, type, timeCreated, and value properties.')}
	}
	this.settingsById.sort(function(a, b) {return a.timeCreated - b.timeCreated})
	
	AC.AutosById.push(this);
	AC.Autos[this.name] = this;
	return this;
}

/**
 * This method calls the action function of the object at regular intervals and returns true if the action function was called.
 * @param {boolean} [runImmediately=false] - If truthy (false by default), the action function will be called immediately.
 * @param {number} [interval=this.Interval ?? 0] - If provided, will override this.interval for this run.
 * @returns {boolean}
 */
AC.Auto.prototype.run = function(runImmediately, interval) {
	runImmediately ??= false;
	interval ??= this.Interval ?? 0;
	
	// Stop the action function if it is running
	this.intvlID = clearInterval(this.intvlID);
	
	// Call the actionFunction if runImmediately is truthy and call it at interval if interval is a positive number
	var success = false;
	if (runImmediately) {
		this.actionFunction();
		success = true;
	}
	if (typeof interval === 'number' && interval > 0) {
		this.intvlID = setInterval(this.actionFunction, interval);
		success = true;
	}
	return success;
}

/*******************************************************************************
 * Automated Actions
 *
 * An automated action calls its action function at regular intervals to repeatedly perform game actions.
 * If any automated action is removed or a setting from the automated actions is removed, it will break save data. Instead, for automated actions set its deprecated property to true. For a setting make its type 'deprecated'.
 ******************************************************************************/
/**
 * This automated action clicks the cookie once every interval.
 */
new AC.Auto('Autoclicker', 'Clicks the cookie once every interval.', 202101172056, function() {
	Game.ClickCookie();
}, {
	'name': 'Interval',
	'desc': 'How often the cookie is clicked.',
	'type': 'slider',
	'timeCreated': 202101172101,
	'value': 0,
	'units': 'ms',
	'min': 0,
	'max': 1000,
	'step': 10
});

/**
 * This automated action clicks shimmers.
 */
new AC.Auto('Golden Cookie Clicker', 'Clicks golden cookies and other shimmers as they appear.', 202101172057, function() {
	Game.shimmers.forEach((function(shimmer) {
		if (!shimmer.wrath || this['Click Wrath Cookies']) {
			shimmer.pop();
		}
	}).bind(this));
}, {
	'name': 'Interval',
	'desc': 'How often to check for golden cookies.',
	'type': 'slider',
	'timeCreated': 202101172102,
	'value': 0,
	'units': 'ms',
	'min': 0,
	'max': 5000,
	'step': 50
}, {
	'name': 'Click Wrath Cookies',
	'desc': 'Whether or not to click wrath cookies.',
	'type': 'switch',
	'timeCreated': 202101172308,
	'value': 1,
	'switchVals': ['Click Wraths Off', 'Click Wraths On'],
	'zeroOff': true
}, {
	'name': 'Combo',
	'desc': 'Whether or not to attempt combos with FTHOF.',
	'type': 'deprecated',
	'timeCreated': 202101172347,
	'value': 0,
	'switchVals': ['Combo Off', 'Dualcast FTHOF'],
	'zeroOff': true
});

/**
 * This automated action clicks fortunes on the news ticker.
 */
new AC.Auto('Fortune Clicker', 'Clicks on fortunes in the news ticker as they appear.', 202101172058, function() {
	if (Game.TickerEffect && Game.TickerEffect.type=='fortune') {Game.tickerL.click()}
}, {
	'name': 'Interval',
	'desc': 'How often to check for fortunes.',
	'type': 'slider',
	'timeCreated': 202101172103,
	'value': 0,
	'units': 'ms',
	'min': 0,
	'max': 10000,
	'step': 100
});

/**
 * This automated action buys the 'Elder pledge' upgrade.
 */
new AC.Auto('Elder Pledge Buyer', 'Buys the Elder pledge toggle when it is available.', 202101172059, function() {
	if (this['Slow Down'] && Game.Upgrades['Elder Pledge'].bought) {
		this.run(false, Math.ceil(33.33333333333333*Game.pledgeT)+10)
		return;
	} else if (Game.HasUnlocked('Elder Pledge') && !Game.Upgrades['Elder Pledge'].bought && Game.Upgrades['Elder Pledge'].canBuy()) {
		Game.Upgrades['Elder Pledge'].buy();
		this.run(false);
		return;
	}
}, {
	'name': 'Interval',
	'desc': 'How often to check for the option to buy the Elder pledge toggle.',
	'type': 'slider',
	'timeCreated': 202101172104,
	'value': 0,
	'units': 'ms',
	'min': 0,
	'max': 5000,
	'step': 50
}, {
	'name': 'Slow Down',
	'desc': 'If Slow Down is on, Elder Pledge Buyer will wait until the timer on the current Elder pledge runs out before checking again.',
	'type': 'switch',
	'timeCreated': 202101172105,
	'value': 1,
	'switchVals': ['Slow Down Off', 'Slow Down On'],
	'zeroOff': true
});

/**
 * This automated action pops wrinklers.
 */
new AC.Auto('Wrinkler Popper', 'Pops wrinklers.', 202101172060, function() {
	var wrinklers = Game.wrinklers.filter(wrinkler => wrinkler.sucked != 0);
	if (wrinklers.length) {
		sortOrder = 2*this['Preserve'] - 1
		wrinklers.sort(function(a, b) {return sortOrder*(b.sucked - a.sucked)});
		for (var i = this['Preserve']; i < wrinklers.length; i++) {Game.wrinklers[wrinklers[i].id].hp = 0}
	}
}, {
	'name': 'Interval',
	'desc': 'How often to check for wrinklers to pop.',
	'type': 'slider',
	'timeCreated': 202101172106,
	'value': 0,
	'units': 'ms',
	'min': 0,
	'max': 3600000,
	'step': 10000
}, {
	'name': 'Preserve',
	'desc': 'Will keep this many wrinklers alive.',
	'type': 'slider',
	'timeCreated': 202101172107,
	'value': 0,
	'units': 'wrinklers',
	'min': 0,
	'max': 11,
	'step': 1
}, {
	'name': 'Wrinkler Sorting',
	'desc': 'Determines if the preserved wrinklers are the ones who\' sucked the most or the least cookies.',
	'type': 'switch',
	'timeCreated': 202101172108,
	'value': 1,
	'switchVals': ['Most Sucked', 'Least Sucked'],
	'zeroOff': false
	
});


/**
 * This automated action triggers Godzamok's Devastation buff by selling and buying back buildings repeatedly.
 */
new AC.Auto('Godzamok Loop', 'Triggers Godzamok\'s Devastation buff by selling and buying back cursors repeatedly.', 202101172100, function() {
	if (typeof this.cache.condition === 'undefined' || !this.cache.condition) {
		this.cache.condition = 0;
		AC.Data.mouseUpgrades.forEach((function(upgrade) {if (Game.Has(upgrade)) {this.cache.condition++}}).bind(this));
		try {this.cache.condition *= Game.hasGod('ruin')} catch {this.cache.condition = 0}
	}
	if (this.cache.condition && Game.buyMode != -1) {
		var numObjects = Game.ObjectsById[0].amount;
		Game.ObjectsById[0].sell(numObjects);
		Game.ObjectsById[0].buy(numObjects);
	}
}, {
	'name': 'Interval',
	'desc': 'How often to sell and buy back buildings.',
	'type': 'slider',
	'timeCreated': 202101172109,
	'value': 0,
	'units': 'ms',
	'min': 0,
	'max': 10050,
	'step': 150
}, {
	'name': 'Sell Extra Cursors',
	'desc': 'How many extra cursors to buy and sell back, in groups of 100. This will lag the game.',
	'type': 'deprecated',
	'timeCreated': 202101172110,
	'value': 0,
	'units': '× 100',
	'min': 0,
	'max': 100,
	'step': 1
}, {
	'name': 'Sell up to',
	'desc': 'Sell all buildings up to and including this one.',
	'type': 'deprecated',
	'timeCreated': 202101172202,
	'value': 0,
	'switchVals': ["Sell cursors", "Sell up to grandmas", "Sell up to farms", "Sell up to mines", "Sell up to factories", "Sell up to banks", "Sell up to temples", "Sell up to wizard towers", "Sell up to shipments", "Sell up to alchemy labs", "Sell up to portals", "Sell up to time machines", "Sell up to antimatter condensers", "Sell up to prisms", "Sell up to chancemakers", "Sell up to fractal engines", "Sell up to javascript consoles", "Sell up to idleverses"],
	'zeroOff': false
});

/*******************************************************************************
 * Automated Action Manipulation
 ******************************************************************************/
AC.AutosById.sort(function(a, b) {return a.timeCreated - b.timeCreated});

/*******************************************************************************
 * Data
 ******************************************************************************/
AC.Data.mouseUpgrades = ['Plastic mouse', 'Iron mouse', 'Titanium mouse', 'Adamantium mouse', 'Unobtainium mouse', 'Eludium mouse', 'Wishalloy mouse', 'Fantasteel mouse', 'Nevercrack mouse', 'Armythril mouse', 'Technobsidian mouse', 'Plasmarble mouse', 'Miraculite mouse', 'Aetherice mouse', 'Omniplast mouse', 'Fortune #104'];

// Doesn't include 'Sugar frenzy' (due to the minor benefit).
// AC.Data.cpsBuffs = ["High-five", "Congregation", "Luxuriant harvest", "Ore vein", "Oiled-up", "Juicy profits", "Fervent adoration", "Manabloom", "Delicious lifeforms", "Breakthrough", "Righteous cataclysm", "Golden ages", "Extra cycles", "Solar flare", "Winning streak", "Macrocosm", "Refactoring", "Cosmic nursery", "Frenzy", "Elder Frenzy", "Dragon Harvest"];

// Doesn't include 'Cursed finger' (since it is also a CPS debuff) or 'Devastation' (since its trigger is entirely player controlled).
// AC.Data.clickBuffs = ["Click frenzy", "Dragonflight"];

/*******************************************************************************
 * Display
 ******************************************************************************/
/**
 * This function calls the appropriate function to update Auto Cookie's portion of the menu.
 */
AC.Display.UpdateMenu = function() {
	if (Game.onMenu === 'prefs') {
		AC.Display.addOptionsMenu();
	} else if (Game.onMenu === 'stats') {
		// Nothing yet.
	}
}
 
/**
 * This function adds an HTML fragment containing the settings menu for Auto Cookie to the end of the Options menu.
 * TODO: Add AC.Settings.L to the settings menu. It determines the max length of statistics.
 */
AC.Display.addOptionsMenu = function() {
	// Create the fragment.
	var frag = document.createDocumentFragment();
	
	var titleDiv = document.createElement('div');
	titleDiv.className = 'title';
	titleDiv.style.color = 'gold';
	titleDiv.textContent = 'Auto Cookie Settings ';
	titleDiv.appendChild(AC.Display.addCollapseButton(AC.Settings, 'S'));
	frag.appendChild(titleDiv);
	
	if (AC.Settings.S) {
		// Auto Cookie's Settings
		var listingDiv = document.createElement('div');
		listingDiv.className = 'listing';
		listingDiv.textContent = 'Version: ' + AC.Version.Full;
		frag.appendChild(listingDiv);
		
		// Append the settings for every automated action.
		for (auto in AC.Autos) frag.appendChild(AC.Display.addAuto(AC.Autos[auto]));
	}
	
	// Add the fragment to the Options menu. Note that the subsection class is only used for a div inside of the menu div. That div contains all the settings.
	var subsection = l('menu').lastChild;
	subsection.insertBefore(frag, subsection.childNodes[subsection.childNodes.length - 1]);
}

/**
 * This function returns a <span> that contains a -/+ button that when clicked changes an object's property between 0 and 1.
 * This span's style is copied from Cookie Monster to maintain consistency.
 * @param {Object} settingObject - The object containing the setting.
 * @param {string} setting - The property of the object that has the setting as its value.
 * @returns {HTMLElement}
 */
AC.Display.addCollapseButton = function(settingObject, setting) {
	var span = document.createElement('span');
	span.style.cursor = 'pointer';
	span.style.display = 'inline-block';
	span.style.height = '14px';
	span.style.width = '14px';
	span.style.borderRadius = '7px';
	span.style.textAlign = 'center';
	span.style.backgroundColor = 'rgb(192, 192, 192)';
	span.style.color = 'black';
	span.style.fontSize = '13px';
	span.style.verticalAlign = 'middle';
	span.textContent = settingObject[setting] ? '-' : '+';
	span.onclick = function() {settingObject[setting]++; settingObject[setting] %= 2; Game.UpdateMenu();};
	
	return span;
}

/**
 * Returns a collapsible menu for the settings of a given automated action.
 * @param {AC.Auto} auto - An automated action.
 * @returns {HTMLElement}
 */
AC.Display.addAuto = function(auto) {
	var frag = document.createDocumentFragment();
	
	if (!auto.deprecated) {
		var div = document.createElement('div');
		div.className = 'title';
		div.style.fontSize = '17px';
		div.style.opacity = '0.7';
		div.textContent = auto.name + ' ';
		div.appendChild(AC.Display.addCollapseButton(auto, 'Header'));
		frag.appendChild(div);
		
		if (auto.Header) {
			var desc = document.createElement('div');
			desc.className = 'listing';
			desc.appendChild(document.createTextNode(auto.desc));
			frag.appendChild(desc);
			
			var listing = document.createElement('div');
			listing.className = 'listing';
			for (setting in auto.settings) {
				listing.appendChild(AC.Display.addSetting(auto, auto.settings[setting]));
			}
			frag.appendChild(listing);
		}
	}
	
	return frag;
}

/**
 * This function returns an html fragment containing a given setting of a given automated action.
 * @param {AC.Auto} auto - An automated action.
 * @param {...AC.Auto~Setting} setting - A setting for that automated action.
 * @returns {HTMLElement}
 *
 * TODO: break event listeners into their own functions to free memory.
 */
AC.Display.addSetting = function(auto, setting) {
	var frag = document.createDocumentFragment();
	
	if (setting.type === 'deprecated' || setting.type === 'header') {
		// Do Nothing.
	} else if (setting.type === 'switch') {
		// Add a button that when clicked cycles through this settings values.
		var a = document.createElement('a');
		if (!auto[setting.name] && setting.zeroOff) {
			a.className = 'option off';
		} else {
			a.className = 'option';
		}
		a.textContent = setting.switchVals[auto[setting.name]];
		a.id = auto.name + ' ' + setting.name + ' Switch';
		a.onclick = function() {
			auto[setting.name]++;
			auto[setting.name] %= setting.switchVals.length;
			l(auto.name + ' ' + setting.name + ' Switch').textContent = setting.switchVals[auto[setting.name]];
			if(setting.zeroOff) {
				if (!auto[setting.name]) {l(auto.name + ' ' + setting.name + ' Switch').className = 'option off'}
				else if (auto[setting.name] === 1) {l(auto.name + ' ' + setting.name + ' Switch').className = 'option'}
			}
			PlaySound('snd/tick.mp3');
		}
		frag.appendChild(a);
		
		// Add a label containing the setting description and append it to the fragment.
		var label = document.createElement('label');
		label.textContent = setting.desc;
		frag.appendChild(label);
		frag.appendChild(document.createElement('br'));
	} else if (setting.type === 'slider') {
		// Add a slider for this settings values.
		var div = document.createElement('div');
		div.className = 'sliderBox';
		
		var sliderTitle = document.createElement('div');
		sliderTitle.style.cssFloat = 'left';
		sliderTitle.textContent = setting.name;
		div.appendChild(sliderTitle);
		
		var sliderValue = document.createElement('div');
		sliderValue.style.cssFloat = 'right';
		sliderValue.textContent = auto[setting.name] + ' ' + setting.units;
		sliderValue.id = auto.name + ' ' + setting.name + ' Slider Value';
		div.appendChild(sliderValue);
		
		var slider = document.createElement('input');
		slider.className = 'slider';
		slider.style.clear = 'both';
		slider.type = 'range';
		slider.min = setting.min;
		slider.max = setting.max;
		slider.step = setting.step;
		slider.value = auto[setting.name]
		slider.oninput = function() {
			auto[setting.name] = 1*l(auto.name + ' ' + setting.name + ' Slider').value;
			l(auto.name + ' ' + setting.name + ' Slider Value').textContent = auto[setting.name] + ' ' + setting.units;
		}
		if (setting.name === 'Interval') {
			slider.onmouseup = function() {auto.run(); PlaySound('snd/tick.mp3')};
		} else {
			slider.onmouseup = function() {PlaySound('snd/tick.mp3')};
		}
		slider.id = auto.name + ' ' + setting.name + ' Slider';
		div.appendChild(slider);
		
		frag.appendChild(div);
		
		// Add a label containing the setting description and append it to the fragment.
		var label = document.createElement('label');
		label.textContent = setting.desc;
		frag.appendChild(label);
		frag.appendChild(document.createElement('br'));
	}
	
	return frag;
}

/*******************************************************************************
 * Settings
 ******************************************************************************/
// AC.Settings is loaded from save data as part of AC.load() and updated with the current settings whenever the game is saved.
AC.Settings = {
	'vCC': AC.Version.CC,	// Cookie Clicker Version.
	'vAC': AC.Version.AC,	// Auto Cookie Version.
	'A': [],	// Settings of the automated actions. This is loaded from the save data when AC.load() is called and updated whenever AC.save() is called.
	'C': '',	// Auto Cookie's favorite cookie.
	'S': 1,	// Whether or not Auto Cookie's settings have been collapsed (0 means collapsed).
}

/*******************************************************************************
 * Register the mod with Cookie Clicker
 ******************************************************************************/
Game.registerMod('AutoCookie', AC);

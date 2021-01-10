/*******************************************************************************
 *  Header
*******************************************************************************/
var AC = {
    "Auto": {},
    "Config": {},
    "Data": {},
    "Helper": {}
}

/*******************************************************************************
 *  Auto
*******************************************************************************/
// Variables for timers.
AC.Auto.click = undefined;
AC.Auto.clickGolden = undefined;
AC.Auto.clickBuff = undefined;
AC.Auto.castFtHoF = undefined;

/***************************************
 *  This function (re)sets all of the autos.
 *  @global {int}   AC.Config.clicksPerSecond   How many times per second the auto clicker should click.
***************************************/
AC.Auto.load = function() {
    AC.Auto.setClick();
    AC.Auto.setClickBuff();
    AC.Auto.setClickGolden();
    AC.Auto.setCastFtHoF();
}

/***************************************
 *  This function sets the auto clicker timer.
 *  It is called by AC.Auto.load()
 *  @global {int}   AC.Config.clicksPerSecond   How many times per second the auto clicker should click.
***************************************/
AC.Auto.setClick = function() {
    if (AC.Config.clicksPerSecond) {
        AC.Auto.click = setInterval(Game.ClickCookie, 1000/AC.Config.clicksPerSecond);
    } else {
        AC.Auto.click = clearInterval(AC.Auto.click);
    }
}

/***************************************
 *  This function sets a buff to the auto clicker for when under the effects of a click boosting buff.
 *  It is called by AC.Auto.load()
 *  @global {int}   AC.Config.clicksPerSecondBuff   How many more times per second the auto clicker should click.
***************************************/
AC.Auto.setClickBuff = function() {
    if (AC.Config.clicksPerSecondBuff) {
        AC.Auto.clickBuff = setInterval(function() {
            if (Game.hasBuff("Click frenzy") ||
                Game.hasBuff("Cursed finger") ||
                Game.hasBuff("Devastation") ||
                Game.hasBuff("Dragonflight")) {
                Game.ClickCookie();
            }
        }, 1000/AC.Config.clicksPerSecondBuff);
    } else {
        AC.Auto.clickBuff = clearInterval(AC.Auto.clickBuff);
    }
}

/***************************************
 *  This function sets the automatic clicking of golden cookies.
 *  It is called by AC.Auto.load()
 *  @global {bool}  AC.Config.autoClickGolden   0 if off. 1 if on.
 *  @global {int}   AC.Config.checkForGoldenTimer   How often the check for golden cookies triggers.
***************************************/
AC.Auto.setClickGolden = function() {
    if (AC.Config.checkForGoldenTimer) {
        AC.Auto.clickGolden = setInterval(function() {
            Game.shimmers.forEach(function(shimmer) {
                if (shimmer.type == "golden" && (shimmer.wrath == 0 ||
                                                 AC.Helper.isEmpty(Game.buffs) ||
                                                 Game.hasBuff("Cookie chain") ||
                                                 Game.hasBuff("Cookie storm"))) {
                    shimmer.pop();
                }
            });
        }, AC.Config.checkForGoldenTimer);
    } else {
        AC.Auto.clickGolden = clearInterval(AC.Auto.clickGolden);
    }
}

/***************************************
 *  This function sets the auto FtHoF caster.
 *  It is called by AC.Auto.load()
 *  @global {int}   AC.Config.castFtHoFTimer    If 0, turn off auto caster. Else create a timer with this length.
***************************************/
AC.Auto.setCastFtHoF = function() {
    if (AC.Config.castFtHoFTimer) {
        AC.Auto.castFtHoF = setInterval(function() {
            var minigame = Game.Objects['Wizard tower'].minigame
            if(!AC.Helper.isEmpty(Game.buffs) && !AC.Helper.hasBadBuff() && minigame.magic >= (10 + 0.6*minigame.magicM)) {
                minigame.castSpell(minigame.spellsById[1]);
            }
        }, AC.Config.castFtHoFTimer);
    } else {
        AC.Auto.castFtHoF = clearInterval(AC.Auto.castFtHoF);
    }
}

/*******************************************************************************
 *  Config
*******************************************************************************/
/***************************************
 *  This function loads configuration data.
 *  @global {dict}  AC.Config   The configuration dictionary.
 *  @param  {dict}  obj The configuration options to load into AC.Config.
***************************************/
AC.Config.load = function(obj) {
    Object.assign(AC.Config, obj);
}

/*******************************************************************************
 *  Data
*******************************************************************************/
AC.Data.configDefault = {
    "clicksPerSecond": 0,
    "clicksPerSecondBuff": 10,
    "checkForGoldenTimer": 1000,
    "castFtHoFTimer": 1000
}

AC.Data.configMax = {
    "clicksPerSecond": 100,
    "clicksPerSecondBuff": 0,
    "checkForGoldenTimer": 1000,
    "castFtHoFTimer": 1000
}

AC.Data.configOff = {
    "clicksPerSecond":0,
    "clicksPerSecondBuff": 0,
    "checkForGoldenTimer": 0,
    "castFtHoFTimer": 0
}

AC.Data.badBuffs = [
    "Slap to the face",
    "Senility",
    "Locusts",
    "Cave-in",
    "Jammed machinery",
    "Recession",
    "Crisis of faith",
    "Magivores",
    "Black holes",
    "Lab disaster",
    "Dimensional calamity",
    "Time jam",
    "Predictable tragedy",
    "Eclipse",
    "Dry spell",
    "Microcosm",
    "Antipattern",
    "Big crunch",
    "Clot"
]

/*******************************************************************************
 *  Helper
*******************************************************************************/
/***************************************
 *  Thus function returns 0 if there is no active debuff and the number of debuffs otherwise.
 *  @global {list}  AC.Data.badBuffs    A list of debuffs.
***************************************/
AC.Helper.hasBadBuff = function() {
	var num = 0;
	AC.Data.badBuffs.forEach(function(buff) {
		if (Game.hasBuff(buff)) {num += 1}
	});
	return num;
}

/***************************************
 *  Thus function returns 0 if the dictionary is empty and 1 if it has contents.
 *  @param  {dict}  obj The dictionary to be checked.
***************************************/
AC.Helper.isEmpty = function(obj) {
    for(var key in obj) {
        if (obj.hasOwnProperty(key)) {
            return 0;
        }
    }
    return 1;
}

/*******************************************************************************
 *  Main
*******************************************************************************/
AC.Config.load(AC.Data.configDefault);
AC.Auto.load();

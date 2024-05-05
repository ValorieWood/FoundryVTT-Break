export const RANK_XP = [0,6,12,24,36,48,72,96,132,168]

const BREAK = {}

BREAK.ability_types = {
    calling: "BREAK.Calling",
    species: "BREAK.Species",
    weapon: "BREAK.Weapon",
    armor: "BREAK.Armor"
}

BREAK.languages = {
    high_akenian: "BREAK.LANGUAGES.High_Akenian",
    dark_tongue: "BREAK.LANGUAGES.Dark_Tongue",
    dream_call: "BREAK.LANGUAGES.Dream_Call",
    fade_song: "BREAK.LANGUAGES.Fade_Song",
    glysian_code: "BREAK.LANGUAGES.Glysian_Code",
    bright_speech: "BREAK.LANGUAGES.Bright_Speech",
    hoshi_ban: "BREAK.LANGUAGES.Hoshi_Ban",
    under_warble: "BREAK.LANGUAGES.Under_Warble",
    creators_script: "BREAK.LANGUAGES.Creators_Script"
}

BREAK.regions = {
    wistful_dark: {
        name: "BREAK.REGIONS.Wistful_Dark",
        "languages": [
            "high_akenian",
            "dark_tongue",
            "dream_call"
        ]
    },
    twilight_meridian: {
        name: "BREAK.REGIONS.Wistful_Dark",
        "languages": [
            "dark_tongue",
            "fade_song",
            "glysian_code"
        ]
    },
    blazing_garden: {
        name: "BREAK.REGIONS.Wistful_Dark",
        "languages": [
            "bright_speech",
            "hoshi_ban",
            "fade_song"
        ]
    },
    buried_kingdom: {
        name: "BREAK.REGIONS.Wistful_Dark",
        "languages": [
            "high_akenian",
            "under_warble",
            "creators_script"
        ]
    }
}

export default BREAK;
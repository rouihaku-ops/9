/* Official station order, service stops and researched POIs. Scene geometry, schedules,
   fares, toys and walking distances are deliberately simplified game representations. */
window.RAIL_DATA = {
  line:{id:'keio-sagamihara',name:'京王相模原線',color:'#d94978'},
  stations:[{id:'tama',name:'京王多摩センター',kana:'けいおうたませんたー',code:'KO41'}, {id:'hori',name:'京王堀之内',kana:'けいおうほりのうち',code:'KO42'}, {id:'minami',name:'南大沢',kana:'みなみおおさわ',code:'KO43'}],
  services:[
    {id:'local',name:'各駅停車',color:'#647982',stops:[0,1,2],model:'9000系',note:'この区間ではすべての駅に停車。'},
    {id:'rapid',name:'快速',color:'#427caa',stops:[0,1,2],model:'9000系',note:'快速も、京王堀之内に停まります。'},
    {id:'express',name:'特急',color:'#cf4266',stops:[0,2],model:'8000系',note:'京王堀之内は通過。次の停車駅は京王多摩センター。'},
    {id:'section',name:'区間急行',color:'#9c8031',stops:[0,1,2],model:'9000系',note:'この区間では各駅に停車。'},
    {id:'liner',name:'京王ライナー',color:'#71538c',stops:[0,2],model:'5000系',note:'全席指定。京王堀之内は通過。この版では見学できます。'}
  ],
  toys:[{id:'train',name:'9000系 ミニ電車',icon:'🚃',rarity:'ふつう',weight:40},{id:'sign',name:'京王堀之内 駅名板',icon:'🚉',rarity:'ふつう',weight:30},{id:'badge',name:'相模原線 バッジ',icon:'🌸',rarity:'レア',weight:20},{id:'gold',name:'きらきら 5000系',icon:'✨',rarity:'スーパーレア',weight:10}],
  missions:[['おうちから出発','走到玄关，按 E 出门。今天去南大沢扭蛋！'],['駅まで歩こう','沿小路走到京王堀之内駅，靠近入口按 E。'],['ICカードをタッチ','走到绿色改札，按 E 刷卡，再去 1 番線。'],['橋本方面の電車へ','1 番線。各停、快速、区間急行都能到南大沢。'],['次は、南大沢','到站开门后按 E 下车。错过也会提醒你。'],['南大沢を歩こう','下月台，刷卡出站。去イトーヨーカドー的扭蛋机。'],['ガチャを持って帰ろう','回到车站刷卡，找 2 番線。选停京王堀之内的车。'],['おかえりなさい','京王堀之内出站，沿街道走回家！']],
  sources:[['京王多摩センター・構内図','https://www.keio.co.jp/train/station/station_map/pdf/ko41_keio-tama-center.pdf'],['京王堀之内駅・停車種別','https://www.keio.co.jp/train/station/ko42_keio-horinouchi/'],['南大沢駅・構内図','https://www.keio.co.jp/train/station/station_map/pdf/ko43_minami-osawa.pdf'],['京王ライナー・座席指定','https://www.keio.co.jp/zasekishitei/'],['イトーヨーカドー南大沢店','https://stores.itoyokado.co.jp/detail/540/'],['南大沢事務所・所在地','https://www.city.hachioji.tokyo.jp/shisetsu/002/p011846.html'],['ガシャポン取扱店舗（南大沢）','https://gashapon.jp/news/?p=6187']]
};

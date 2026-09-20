/* Official station order, service stops and researched POIs. Scene geometry, schedules,
   fares, toys and walking distances are deliberately simplified game representations. */
window.RAIL_DATA = {
  line:{id:'keio-sagamihara',name:'京王相模原線',color:'#d94978'},
  stations:[
    {id:'chofu',name:'調布',kana:'ちょうふ',code:'KO18',down:2,up:4,theme:'city',tag:'映画と広場のまち',landmark:'トリエ京王調布',place:'駅前広場',task:'広場の映画ポスターを見つけよう',item:'映画のポスター',word:'映画',reading:'えいが',zh:'电影'},
    {id:'tamagawa',name:'京王多摩川',kana:'けいおうたまがわ',code:'KO35',down:1,up:2,theme:'river',tag:'川風を感じるまち',landmark:'多摩川河川敷',place:'川辺の休憩所',task:'川辺で白い鳥を見つけよう',item:'白い鳥の観察',word:'川',reading:'かわ',zh:'河流'},
    {id:'inada',name:'京王稲田堤',kana:'けいおういなだづつみ',code:'KO36',down:1,up:2,theme:'sakura',tag:'南武線へ歩いて乗り換え',landmark:'稲田公園',place:'JR稲田堤駅への道',task:'公園で桜の葉を見つけよう',item:'桜の葉',word:'乗り換え',reading:'のりかえ',zh:'换乘'},
    {id:'yomiuri',name:'京王よみうりランド',kana:'けいおうよみうりらんど',code:'KO37',down:1,up:2,theme:'gondola',tag:'空に浮かぶゴンドラ',landmark:'ゴンドラ スカイシャトル',place:'山への案内所',task:'空を行くゴンドラを観察しよう',item:'ゴンドラの絵',word:'空',reading:'そら',zh:'天空'},
    {id:'inagi',name:'稲城',kana:'いなぎ',code:'KO38',down:1,up:2,theme:'pear',tag:'梨が育つまち',landmark:'稲城市役所',place:'梨の直売所（ゲーム）',task:'梨の直売所のお手伝いをしよう',item:'梨のかご',word:'梨',reading:'なし',zh:'梨'},
    {id:'wakaba',name:'若葉台',kana:'わかばだい',code:'KO39',down:1,up:3,theme:'depot',tag:'車両基地のあるまち',landmark:'若葉台車両基地',place:'駅前の休憩所',task:'柵の外からピンクの電車を探そう',item:'電車のスケッチ',word:'車両基地',reading:'しゃりょうきち',zh:'车辆基地'},
    {id:'nagayama',name:'京王永山',kana:'けいおうながやま',code:'KO40',down:1,up:2,theme:'hospital',tag:'家族にやさしいまち',landmark:'日本医科大学多摩永山病院',place:'駅前の花だん',task:'病院の受付に絵のお手紙を届けよう',item:'絵のお手紙',word:'受付',reading:'うけつけ',zh:'接待处'},
    {id:'tama',name:'京王多摩センター',kana:'けいおうたませんたー',code:'KO41',down:1,up:3,theme:'tama',tag:'公園とモノレールのまち',landmark:'パルテノン多摩',place:'多摩中央公園',task:'公園・図書館・モノレールをめぐろう',item:'多摩センターの思い出',word:'公園',reading:'こうえん',zh:'公园'},
    {id:'hori',name:'京王堀之内',kana:'けいおうほりのうち',code:'KO42',down:1,up:2,theme:'home',tag:'わたしのまち'},
    {id:'minami',name:'南大沢',kana:'みなみおおさわ',code:'KO43',down:1,up:2,theme:'outlet',tag:'ガチャを探すおでかけ'},
    {id:'sakai',name:'多摩境',kana:'たまさかい',code:'KO44',down:1,up:2,theme:'forest',tag:'緑の丘を歩こう',landmark:'小山内裏公園',place:'公園の案内所',task:'公園でどんぐりを見つけよう',item:'どんぐり',word:'森',reading:'もり',zh:'森林'},
    {id:'hashimoto',name:'橋本',kana:'はしもと',code:'KO45',down:1,up:1,theme:'terminal',tag:'相模原線の終点',landmark:'ミウィ橋本',place:'JR線への連絡通路',task:'北口デッキで旅のカードを受け取ろう',item:'橋本の旅カード',word:'終点',reading:'しゅうてん',zh:'终点'}
  ],
  // Adjacent distances in km. Travel time is compressed for the game.
  distances:[1.2,1.3,1.4,1.6,3.3,2.6,2.3,2.3,2.2,1.9,2.5],
  services:[
    {id:'local',name:'各駅停車',color:'#647982',stops:[0,1,2,3,4,5,6,7,8,9,10,11],model:'9000系',note:'相模原線のすべての駅に停車。'},
    {id:'rapid',name:'快速',color:'#427caa',stops:[0,1,2,3,4,5,6,7,8,9,10,11],model:'9000系',note:'相模原線内は各駅に停車。'},
    {id:'express',name:'特急',color:'#cf4266',stops:[0,2,6,7,9,11],model:'8000系',note:'調布・京王稲田堤・京王永山・京王多摩センター・南大沢・橋本に停車。'},
    {id:'section',name:'区間急行',color:'#9c8031',stops:[0,1,2,3,4,5,6,7,8,9,10,11],model:'9000系',note:'相模原線内は各駅に停車。'},
    {id:'liner',name:'京王ライナー',color:'#71538c',stops:[6,7,9,11],model:'5000系',note:'全席指定。ゲーム内チケットが必要。調布・京王稲田堤・京王堀之内などは通過。'}
  ],
  toys:[{id:'train',name:'9000系 ミニ電車',icon:'🚃',rarity:'ふつう',weight:40},{id:'sign',name:'京王堀之内 駅名板',icon:'🚉',rarity:'ふつう',weight:30},{id:'badge',name:'相模原線 バッジ',icon:'🌸',rarity:'レア',weight:20},{id:'gold',name:'きらきら 5000系',icon:'✨',rarity:'スーパーレア',weight:10}],
  missions:[['おうちから出発','走到玄关，按 E 出门。今天去南大沢扭蛋！'],['駅まで歩こう','沿小路走到京王堀之内駅，靠近入口按 E。'],['ICカードをタッチ','走到绿色改札，按 E 刷卡，再去 1 番線。'],['橋本方面の電車へ','1 番線。各停、快速、区間急行都能到南大沢。'],['次は、南大沢','到站开门后按 E 下车。错过也会提醒你。'],['南大沢を歩こう','下月台，刷卡出站。去三井アウトレットパーク的扭蛋机。'],['ガチャを持って帰ろう','回到车站刷卡，找 2 番線。选停京王堀之内的车。'],['おかえりなさい','京王堀之内出站，沿街道走回家！']],
  sources:[['京王動物園線・多摩動物公園駅','https://www.keio.co.jp/train/station/ko47_tama-dobutsukoen/'],['高幡不動駅・構内図','https://www.keio.co.jp/train/station/station_map/pdf/ko29_takahatafudo.pdf'],['多摩動物公園駅・構内図','https://www.keio.co.jp/train/station/station_map/pdf/ko47_tama-dobutsukoen.pdf'],['程久保駅・周辺案内','https://www.tama-monorail.co.jp/monorail/station/hodokubo/'],['高幡不動駅・周辺案内','https://www.tama-monorail.co.jp/monorail/station/takahatafudo/'],['多摩モノレール・正式站序','https://www.tama-monorail.co.jp/monorail/'],['松が谷・駅間距離','https://www.tama-monorail.co.jp/monorail/station/matsugaya/fare.html'],['しゃぶ葉 調布南口店','https://store-info.skylark.co.jp/map/199942/'],['ライナー券売機','https://www.keio.co.jp/zasekishitei/ride/ticket/vending_machines.html'],['若葉台・番線案内','https://www.keio.co.jp/train/station/station_map/pdf/ko39_wakabadai.pdf'],['若葉台車両基地','https://www.keio.co.jp/keiokids/2024/dentetsu_waka.html'],['三井アウトレットパーク 多摩南大沢・カプセルトイ','https://mitsui-shopping-park.com/mop/tama/shop/2657257.html'],['京王稲田堤・特急停車','https://www.keio.co.jp/train/station/ko36_keio-inadazutsumi/'],['多摩中央公園','https://tama-central-park.jp/about/'],['パルテノン多摩','https://www.city.tama.lg.jp/map/bunka/bunka/index.html'],['多摩永山病院','https://www.nms.ac.jp/tama-h/'],['小山内裏公園','https://www.tokyo-park.or.jp/park/oyamadairi/index.html'],['稲城市役所','https://www.city.inagi.tokyo.jp/shisetsu/shiyakusho/1004833.html'],['稲田公園','https://www.city.kawasaki.jp/530/page/0000018947.html'],['ゴンドラ スカイシャトル','https://www.yomiuriland.com/traffic/'],['トリエ京王調布','https://trie-keiochofu.jp/access/'],['ミウィ橋本','https://www.mewe.jp/guide/access.jsp'],['多摩モノレール','https://www.tama-monorail.co.jp/'],['京王多摩センター・構内図','https://www.keio.co.jp/train/station/station_map/pdf/ko41_keio-tama-center.pdf'],['京王堀之内駅・停車種別','https://www.keio.co.jp/train/station/ko42_keio-horinouchi/'],['南大沢駅・構内図','https://www.keio.co.jp/train/station/station_map/pdf/ko43_minami-osawa.pdf'],['京王ライナー・座席指定','https://www.keio.co.jp/zasekishitei/'],['イトーヨーカドー南大沢店','https://stores.itoyokado.co.jp/detail/540/'],['南大沢事務所・所在地','https://www.city.hachioji.tokyo.jp/shisetsu/002/p011846.html']]
};

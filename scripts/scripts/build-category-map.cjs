/**
 * Builds category mapping from ~1483 categories to ~100 major ones.
 */
const fs = require('fs');
const path = require('path');
const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public', 'ai-catalog.json'), 'utf8'));
const allCats = Object.keys(catalog.categories);

const TARGETS = [
  "AI Chatbot","AI Assistant","AI Agent","AI Search Engine","AI LLM",
  "AI Code Assistant","AI Developer Tools","AI API","AI Testing","AI Database",
  "AI Web Scraping","No-Code & Low-Code","AI Website Builder","AI CRM","AI Github",
  "AI Writing","AI Copywriting","AI Summarizer","AI Paraphraser","AI Grammar Checker",
  "AI Content Detector","AI Blog Generator","AI Story Generator",
  "AI Image Generator","AI Photo Editor","AI Image Upscaler","AI Avatar Generator",
  "AI Logo Generator","AI Anime Generator","AI Headshot Generator","AI Face Swap Generator",
  "AI Video Generator","AI Video Editor","AI Video Translator","AI Video Summarizer",
  "AI Avatar Video Generator","AI Video Enhancer",
  "AI Voice Generator","AI Speech-to-Text","AI Music Generator","AI Audio Editor",
  "AI Podcast","AI Transcription",
  "AI Design","AI Graphic Design","AI Interior Design","AI Architecture","AI Fashion",
  "AI Marketing","AI SEO Tool","AI Advertising","AI Social Media","AI Influencer","AI Email Marketing",
  "AI Finance","AI Trading Bot","AI Crypto","AI Sales","AI E-commerce","AI Real Estate",
  "AI Productivity","AI Email Assistant","AI Spreadsheet","AI Presentation",
  "AI PDF","AI Task Management","AI Meeting Assistant","AI Calendar",
  "AI Education","AI Language Learning","AI Tutor","AI Quiz Generator","AI Flashcard Maker",
  "AI Research","AI Data Analysis","AI Machine Learning","AI Model","AI OCR",
  "AI Healthcare","AI Fitness","AI Mental Health",
  "AI Legal","AI Human Resources","AI Resume Builder","AI Recruiting",
  "AI Customer Support","AI Translation","AI Call Center",
  "AI Gaming","AI Character","AI Roleplay","AI Dating Assistant","AI Joke",
  "AI 3D Model Generator","AI Animation Generator","AI Drawing","AI Prompt Generator",
  "AI QR Code Generator","AI Meme Generator",
  "AI Travel","AI Food",
  "AI Shopping Assistant","AI News","AI Security","AI Robotics","AI Other",
];

const RULES = [
  [/\bcode\b|\bcoding\b|\bcopilot\b|\bdebug\b|\bprogram/i, "AI Code Assistant"],
  [/\bdeveloper\b|\bdevtools?\b/i, "AI Developer Tools"],
  [/\bapi\b/i, "AI API"],
  [/\btest(ing)?\b|\bqa\b|\bbug\b/i, "AI Testing"],
  [/\bdatabas\b|\bsql\b/i, "AI Database"],
  [/\bgithub\b|\bgit\b|\brepositor\b|\bgitlab\b/i, "AI Github"],
  [/\bscrap\b|\bcrawl\b/i, "AI Web Scraping"],
  [/\bno.?code\b|\blow.?code\b/i, "No-Code & Low-Code"],
  [/\bwebsite.*build\b|\blanding.?page\b|\bshopify\b|\bweb.*creat/i, "AI Website Builder"],
  [/\bcrm\b|\berp\b/i, "AI CRM"],
  [/\bwriting\b|\bwriter\b|\bscript\b|\bessay\b|\btext.*generat/i, "AI Writing"],
  [/\bcopywrit/i, "AI Copywriting"],
  [/\bblog/i, "AI Blog Generator"],
  [/\bsummar/i, "AI Summarizer"],
  [/\bparaphras\b|\brephras\b|\brewrit\b/i, "AI Paraphraser"],
  [/\bgrammar\b|\bspell\b|\bproofread/i, "AI Grammar Checker"],
  [/\bdetect\b|\bhumaniz\b|\bbypass.*ai\b|\bai.*detect\b|\bplagiarism/i, "AI Content Detector"],
  [/\bstor(y|yboard)\b|\bnovel\b|\bfiction\b|\bpoem\b|\bpoetry\b|\blyric\b/i, "AI Story Generator"],
  [/\bimage.*generat\b|\btext.*to.*image\b|\bart.*generat\b|\bpainting\b/i, "AI Image Generator"],
  [/\bphoto.*edit\b|\bimage.*edit\b|\bphoto.*enhanc\b|\bcoloriz\b|\bcrop.*image\b|\bwatermark/i, "AI Photo Editor"],
  [/\bupscale\b|\bupscaler\b|\bunblur\b|\bdeblur\b|\bimage.*enhanc/i, "AI Image Upscaler"],
  [/\bavatar\b|\bprofile.*picture\b|\bperson.*generat\b|\bbaby.*generat\b|\bportrait/i, "AI Avatar Generator"],
  [/\blogo\b|\bicon.*generat\b/i, "AI Logo Generator"],
  [/\banime\b|\bmanga\b/i, "AI Anime Generator"],
  [/\bheadshot\b|\bprofessional.*photo/i, "AI Headshot Generator"],
  [/\bface.?swap\b|\bgender.?swap\b/i, "AI Face Swap Generator"],
  [/\bbackground.*remov\b|\bbg.*remov\b|\binpaint\b|\boutpaint\b|\beraser\b|\bexpand.*image/i, "AI Photo Editor"],
  [/\btattoo\b|\bcartoon\b|\bcomic\b|\bdrawing\b|\bsketch\b|\billustrat\b|\bpixel.*art\b|\bcoloring/i, "AI Drawing"],
  [/\bface.*recogn\b|\bimage.*classif\b|\bimage.*scan/i, "AI Machine Learning"],
  [/\bvideo.*generat\b|\btext.*to.*video\b|\bmovie.*generat\b|\bstock.*video\b|\bshort.*video\b|\breel\b|\bvideo.*record\b|\brepurpose\b|\banimated.*video/i, "AI Video Generator"],
  [/\bvideo.*edit\b|\bthumbnail\b|\bsubtitle/i, "AI Video Editor"],
  [/\bvideo.*translat/i, "AI Video Translator"],
  [/\bvideo.*summar/i, "AI Video Summarizer"],
  [/\bavatar.*video\b|\btalking.*head\b|\blip.?sync\b/i, "AI Avatar Video Generator"],
  [/\bvideo.*upscale\b|\bvideo.*enhanc/i, "AI Video Enhancer"],
  [/\bvoice.*generat\b|\bvoiceover\b|\btext.*to.*speech\b|\btts\b|\bspeech.*synth\b|\bcelebrity.*voice/i, "AI Voice Generator"],
  [/\bspeech.*to.*text\b|\bstt\b|\btranscrib\b|\baudio.*to.*text/i, "AI Speech-to-Text"],
  [/\bvoice.*chang\b|\bvoice.*clone\b|\bvocal\b/i, "AI Voice Generator"],
  [/\bmusic.*generat\b|\bmusic.*product\b|\btext.*to.*music\b|\bsong.*generat\b|\bmelody\b|\bbeat\b|\bstems.*split\b|\bremix\b|\bsinging\b|\bvocal.*remov\b|\bguitar\b|\bpiano\b|\bdrum\b|\balbum.*cover/i, "AI Music Generator"],
  [/\baudio.*edit\b|\baudio.*enhanc\b|\bsound.*effect\b|\baudio.*generat\b|\bnoise.*cancell\b|\brecord/i, "AI Audio Editor"],
  [/\bpodcast\b/i, "AI Podcast"],
  [/\bdubbing\b|\bdub\b/i, "AI Video Translator"],
  [/\binterior.*design\b|\broom.*design\b|\bkitchen.*design\b|\blandscape\b|\bfloor.*plan/i, "AI Interior Design"],
  [/\barchitect\b|\bbuilding/i, "AI Architecture"],
  [/\bfashion\b|\bcloth\b|\boutfit\b|\bhairstyle\b|\bhair\b|\bbeauty\b|\bbikini\b|\bdress\b|\bt-shirt\b|\bproduct.*photograph/i, "AI Fashion"],
  [/\bgraphic.*design\b|\bposter\b|\bbanner\b|\bmockup\b|\binfograph\b|\bsvg\b|\bfont.*generat\b|\bbook.*cover\b|\bbusiness.*card\b|\b3d.*model\b|\b3d.*print\b|\btext.*to.*3d\b|\bimage.*to.*3d\b|\bwallpaper/i, "AI Graphic Design"],
  [/\bdesign\b|\bcreative\b|\bpattern\b|\bcolor.*palette\b|\bcanva/i, "AI Design"],
  [/\bseo\b|\bsearch.*engine.*optim\b|\bbacklink\b|\bkeyword/i, "AI SEO Tool"],
  [/\badvertis\b|\bad.*generat\b|\bad.*creative\b|\bgoogl.*ads/i, "AI Advertising"],
  [/\bemail.*market\b|\bnewsletter\b|\bcold.*email\b|\bcold.*call/i, "AI Email Marketing"],
  [/\baffiliate\b|\binfluenc/i, "AI Influencer"],
  [/\bsocial.*media\b|\bsocial.*network\b|\binstagram\b|\btiktok\b|\byoutube\b|\btwitter\b|\btweet\b|\bhashtag\b|\bcaption/i, "AI Social Media"],
  [/\bmarket\b|\bbrand\b|\blead.*generat\b|\bdigital.*market/i, "AI Marketing"],
  [/\bfinanc\b|\bbudget\b|\bexpense\b|\btax\b|\binvoice\b|\baccounting\b|\bbookkeep/i, "AI Finance"],
  [/\binvest\b|\bstock\b|\bportfolio\b|\bwealth/i, "AI Trading Bot"],
  [/\btrad\b|\bforex\b|\bday.*trade/i, "AI Trading Bot"],
  [/\bcrypto\b|\bblockchain\b|\bnft\b|\bweb3\b|\bdefi\b/i, "AI Crypto"],
  [/\bsales\b|\bpitch.*deck\b|\bproposal/i, "AI Sales"],
  [/\be-?commerc\b|\bonline.*store\b|\bproduct.*descrip\b|\bdropship\b|\bshopif/i, "AI E-commerce"],
  [/\breal.*estate\b|\bproperty\b|\bhous/i, "AI Real Estate"],
  [/\binsurance\b/i, "AI Finance"],
  [/\bbusiness.*idea\b|\bbusiness.*name\b|\bstartup\b|\bentrepreneur\b|\bconsulting\b|\bsop/i, "AI Productivity"],
  [/\bproductiv\b|\bautomat\b|\bworkflow\b|\befficienc\b|\bhabit\b|\breminder\b|\blife.*coach\b|\bself.*improv\b|\bpersonal.*develop\b|\bmotivation\b|\binspiration\b|\bquotes\b|\baffirmation\b|\bparent/i, "AI Productivity"],
  [/\bemail\b|\bmail/i, "AI Email Assistant"],
  [/\bmeeting\b/i, "AI Meeting Assistant"],
  [/\bcalendar\b|\bschedul/i, "AI Calendar"],
  [/\bspreadsheet\b|\bexcel\b|\bcsv\b|\bformula/i, "AI Spreadsheet"],
  [/\bpresentation\b|\bppt\b|\bslide\b|\bmind.*map\b|\bbrainstorm\b|\bdiagram\b|\bflowchart\b|\bchart/i, "AI Presentation"],
  [/\bpdf\b|\bdocument\b|\bfile\b|\bnote\b|\bknowledge.*base\b|\bwiki\b|\bknowledge.*manag\b|\bknowledge.*graph/i, "AI PDF"],
  [/\btask.*manag\b|\btodo\b|\bproject.*manag\b|\bkanban\b|\bagile\b|\broadmap\b|\bproduct.*manag/i, "AI Task Management"],
  [/\blanguage.*learn\b|\blinguist/i, "AI Language Learning"],
  [/\btutor\b|\bteach\b|\binstruct/i, "AI Tutor"],
  [/\bhomework\b|\bassign/i, "AI Education"],
  [/\blesson.*plan\b|\bcurriculum/i, "AI Education"],
  [/\bflashcard\b/i, "AI Flashcard Maker"],
  [/\bquiz\b|\bquizz\b|\bquestion.*generat\b|\bexam/i, "AI Quiz Generator"],
  [/\bcourse\b|\be-?learn\b|\beducat\b|\blearn\b|\bstud\b|\bschool\b|\buniversi\b|\bcitation\b|\bpaper\b|\bthes\b|\bmath\b/i, "AI Education"],
  [/\bresearch\b|\bliterature.*review/i, "AI Research"],
  [/\bdata.*analys\b|\bdata.*visual\b|\bdashboard\b|\breport\b|\bstatistic\b|\bpredict\b|\bforecast/i, "AI Data Analysis"],
  [/\bmachine.*learn\b|\bdeep.*learn\b|\bneural.*network\b|\bmodel.*train\b|\bfine.?tun\b|\bopen.*source.*model\b|\brag\b|\bretrieval/i, "AI Machine Learning"],
  [/\bllm\b|\blarge.*language\b|\bfoundation.*model\b|\bmodel.*librar/i, "AI LLM"],
  [/\bocr\b|\bscanner\b|\bscanning/i, "AI OCR"],
  [/\bhealth\b|\bmedical\b|\bclinical\b|\bdoctor\b|\bpatient\b|\bhospital\b|\bdrug\b|\bpharma\b|\bsymptom\b|\bdisease/i, "AI Healthcare"],
  [/\bmental.*health\b|\btherapy\b|\btherapist\b|\bcounsel\b|\bpsycholog\b|\bwellness\b|\bmeditat\b|\bstress\b|\banxiety\b/i, "AI Mental Health"],
  [/\bfitness\b|\bworkout\b|\bexercise\b|\bgym\b|\byoga\b|\bdiet\b|\bnutrition\b|\bcalori\b|\bmeal\b|\brecipe\b|\bcooking\b|\bfood\b|\brestaurant\b|\bweight/i, "AI Fitness"],
  [/\blegal\b|\blaw\b|\blawyer\b|\bcontract\b|\bagreement\b|\bcompliance/i, "AI Legal"],
  [/\bhuman.*resource\b|\bhr\b|\bemploy\b|\bpayroll/i, "AI Human Resources"],
  [/\bresume\b|\bcv\b|\bcover.*letter\b|\bcareer/i, "AI Resume Builder"],
  [/\brecruit\b|\bhiring\b|\btalent\b|\bjob.*descrip\b|\bcandidate\b|\binterview/i, "AI Recruiting"],
  [/\bcustomer.*support\b|\bcustomer.*service\b|\bhelpdesk\b|\bticket/i, "AI Customer Support"],
  [/\btranslat\b|\blocali/i, "AI Translation"],
  [/\bcall.*center\b|\bphone/i, "AI Call Center"],
  [/\bchat\b|\bconversat\b|\bdialogue\b|\bmessag\b|\breply\b|\bresponse\b|\bbio.*generat\b|\banswer/i, "AI Chatbot"],
  [/\bgam(e|ing|er)\b|\bchess\b|\bsport/i, "AI Gaming"],
  [/\bcharact\b|\bnpc\b|\broleplay\b|\bdnd/i, "AI Character"],
  [/\bgirlfriend\b|\bboyfriend\b|\bcompanion\b|\bdating\b|\bromance/i, "AI Dating Assistant"],
  [/\bjoke\b|\bhumor\b|\bfunny\b|\bprank\b|\bentertain/i, "AI Joke"],
  [/\bmeme\b/i, "AI Meme Generator"],
  [/\b3d\b|\bthree.?d/i, "AI 3D Model Generator"],
  [/\banimat/i, "AI Animation Generator"],
  [/\bprompt/i, "AI Prompt Generator"],
  [/\bqr.*code/i, "AI QR Code Generator"],
  [/\bsticker\b|\bemoji\b|\bgif\b/i, "AI Drawing"],
  [/\btravel\b|\btrip\b|\bvacation\b|\bflight\b|\bhotel\b|\bbooking/i, "AI Travel"],
  [/\bshopp\b|\bgift\b|\bprice.*compar/i, "AI Shopping Assistant"],
  [/\bnews\b|\bjournalis\b|\bheadline/i, "AI News"],
  [/\bsecur\b|\bprivacy\b|\bencrypt\b|\bcyber/i, "AI Security"],
  [/\brobot\b|\bdrone\b|\bautonom\b|\bself.?driv/i, "AI Robotics"],
  [/\bopen.?source\b/i, "AI LLM"],
  [/\brelig\b|\bspiritual\b|\bprayer/i, "AI Other"],
  [/\bread\b|\breader/i, "AI Summarizer"],
  [/\bebook/i, "AI Writing"],
  [/\bform/i, "AI Website Builder"],
  [/\bbrowser/i, "AI Search Engine"],
  [/\breview/i, "AI Writing"],
  [/\bname.*generat\b|\bdomain.*name/i, "AI Other"],
  [/\bbackgr/i, "AI Graphic Design"],
  [/\bcover\b|\boutline/i, "AI Writing"],
  [/\bby?pass/i, "AI Content Detector"],
  [/\bmap\b/i, "AI Other"],
  [/\bservice/i, "AI Other"],
  [/\blife\b/i, "AI Productivity"],
  [/\bml\b|\bmodel\b/i, "AI Machine Learning"],
  [/\bdream/i, "AI Other"],
];

function normalizeCategory(cat) {
  if (!cat || typeof cat !== 'string') return "AI Other";
  let c = cat.trim();
  if (c.includes(',')) {
    const parts = c.split(',').map(p => p.trim()).filter(Boolean);
    let best = parts[0];
    for (const part of parts) {
      const lower = part.toLowerCase();
      if (['ai chatbot','ai image generation','ai video generation','ai design','ai automation','ai writing','ai productivity'].includes(lower)) continue;
      if (part.length > best.length || !best.toLowerCase().startsWith('ai')) best = part;
    }
    c = best;
  }
  c = c.replace(/\bAi\b/g, 'AI').replace(/\bai\b/g, 'AI');
  if (TARGETS.includes(c)) return c;
  const lower = c.toLowerCase();
  for (const [regex, target] of RULES) {
    if (regex.test(lower)) return target;
  }
  return "AI Other";
}

const mapped = {};
for (const cat of allCats) {
  const r = normalizeCategory(cat);
  if (!mapped[r]) mapped[r] = 0;
  mapped[r] += catalog.categories[cat];
}
const sorted = Object.entries(mapped).sort((a, b) => b[1] - a[1]);
console.log(`Original: ${allCats.length} -> Mapped: ${sorted.length}`);
sorted.forEach(([cat, count], i) => console.log(`${i+1}. ${count} ${cat}`));

const categoryMap = {};
for (const cat of allCats) categoryMap[cat] = normalizeCategory(cat);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'category-map.json'), JSON.stringify(categoryMap, null, 2));
console.log('\nSaved public/category-map.json');

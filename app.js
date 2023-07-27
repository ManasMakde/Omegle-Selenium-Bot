import './additional/convert.cjs'; //converts all .ejs files into .html files for faster distribution
import riddle_obj from './_settings/riddle.js';
import jokes_obj from './_settings/jokes.js';
import { writeFileSync, createWriteStream, readFileSync, existsSync } from 'fs';
import { Builder } from 'selenium-webdriver';
import { By, Key, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import Genius from "genius-lyrics";
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server);

class Ttt {

  constructor() {
    this.board = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]];
  }

  async instructions() {
    neurons.out((`---
       Here are the numbers for placing your move (you are O)
       [1][2][3]
       [4][5][6]
       [7][8][9]
       < type /exit to end the game >
       `));
  }

  async show(move = 1) {
    let temp = '---\r';
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++)
        if (this.board[i][j] == -1)
          temp += '[X]';
        else
          if (this.board[i][j] == 1)
            temp += '[O]';
          else
            temp += '[--]';
      temp += '\r';
    }
    if (move == 1)
      temp += 'Enter Your Move=>';

    neurons.out(temp);
  }

  async play() {
    await this.instructions();
    await this.show();

    while (neurons.sanity == 1) {
      let response = await neurons.latest_input();
      if (response == '/exit') {
        neurons.out('Exiting game\rI would have won anyways...');
        return 0;
      }
      response = Number(response);

      if (!isNaN(response) && 0 < response && response < 10 && this.board[Math.trunc((response - 1) / 3)][(response - 1) % 3] == 0) {
        this.board[Math.trunc((response - 1) / 3)][(response - 1) % 3] = 1;
        let stat = await this.game_stat();

        if (stat == 0) {
          await this.bot_move();
          this.show();
          stat = await this.game_stat();
        }
        if (stat != 0)
          this.show(0);
        if (stat == 1) { neurons.out('you won...this time\rgg'); return 1; }
        else if (stat == -1) { neurons.out(`loool I won ez gg\ryou'll win next time (probably not lol)`); return -1 }
        else if (stat == 2) { neurons.out(`it's a tie\rthat all ya got?`); return 2 }
      }
      else
        neurons.out('incorrect move try again\rEnter number=>');
    }
  }

  async game_stat() {
    let space_left = 0;
    for (var i = 0; i < 3; i++) { //checking vertically or horizontally completed

      for (var j = 0; j < 3 && space_left == 0; j++)//checking if all slots are filled
        if (this.board[i][j] == 0) {
          space_left = 1;
          break;
        }

      let horizontal = this.board[i][0] + this.board[i][1] + this.board[i][2];
      let vertical = this.board[0][i] + this.board[1][i] + this.board[2][i];

      if (vertical == -3 || horizontal == -3)
        return -1;
      if (vertical == 3 || horizontal == 3)
        return 1;
    }
    let diagLR = this.board[0][0] + this.board[1][1] + this.board[2][2];//diagonal L->R
    let diagRL = this.board[0][2] + this.board[1][1] + this.board[2][0];//diagonal R->L

    if (diagLR == 3 || diagRL == 3)
      return 1;//user has won
    if (diagLR == -3 || diagRL == -3)
      return -1;//bot has won

    if (space_left == 0)
      return 2;//tie

    return 0;//all clear
  }

  async bot_move() {

    /////// personal win //////
    for (var i = 0; i < 3; i++)
      if (this.board[i][0] + this.board[i][1] + this.board[i][2] == -2) { this.board[i][this.board[i].findIndex(k => k == 0)] = -1; return; }
      else
        if (this.board[0][i] + this.board[1][i] + this.board[2][i] == -2) { this.board[[this.board[0][i], this.board[1][i], this.board[2][i]].findIndex(k => k == 0)][i] = -1; return; }

    if (this.board[0][0] + this.board[1][1] + this.board[2][2] == -2) {
      let temp = [this.board[0][0], this.board[1][1], this.board[2][2]].findIndex(k => k == 0);
      this.board[temp][temp] = -1;
      return;
    }
    if (this.board[0][2] + this.board[1][1] + this.board[2][0] == -2) {
      let temp = [this.board[0][2], this.board[1][1], this.board[2][0]].findIndex(k => k == 0);
      this.board[temp][2 - temp] = -1;
      return;
    }
    /////// opponent block //////
    for (var i = 0; i < 3; i++)
      if (this.board[i][0] + this.board[i][1] + this.board[i][2] == 2) { this.board[i][this.board[i].findIndex(k => k == 0)] = -1; return; }
      else
        if (this.board[0][i] + this.board[1][i] + this.board[2][i] == 2) { this.board[[this.board[0][i], this.board[1][i], this.board[2][i]].findIndex(k => k == 0)][i] = -1; return; }

    if (this.board[0][0] + this.board[1][1] + this.board[2][2] == 2) {
      let temp = [this.board[0][0], this.board[1][1], this.board[2][2]].findIndex(k => k == 0);
      this.board[temp][temp] = -1;
      return;
    }
    if (this.board[0][2] + this.board[1][1] + this.board[2][0] == 2) {
      let temp = [this.board[0][2], this.board[1][1], this.board[2][0]].findIndex(k => k == 0);
      this.board[temp][2 - temp] = -1;
      return;
    }
    ////// random position /////
    for (var i = Math.floor(Math.random() * 3); i < 3; i = (i == 3 ? 0 : i + 1))
      for (var j = Math.floor(Math.random() * 3); j < 3; j = (j == 3 ? 0 : j + 1))
        if (this.board[i][j] == 0) { this.board[i][j] = -1; return; }
  }
};

class Neurons {
  constructor() {
    this.default_memory();
  }
  async default_memory() { //initializes all default memory
    this.latest = 2;

    this.sanity = 1;
    //(sanity==0) => the source of input (in this case the bot body) has stopped working/reset
  }

  async latest_input() { //returns the latest input 
    let chat = '';
    let t = 0;
    while (await (await bot.whenElement(By.css('.sendbtn'), 3000, 1)).isEnabled()) //main loop for handling input and output inside a connected chat
    {
      try {
        let temp_txt = await bot.readAttribute(By.css(`.logitem:nth-of-type(${this.latest})`), 'innerText', 3000, 1); //tries to read the latest message if it has been recived yet
        t = 0;

        if (temp_txt != 'Stranger is typing...')
          io.emit('bot cmd', { 'command': 'log tail', 'reply': temp_txt });

        if (temp_txt == 'Stranger is typing...' || temp_txt.startsWith('Stranger'))
          try { chat = await bot.readAttribute(By.css(`.logitem:nth-of-type(${this.latest}) .strangermsg`), 'innerText', 5000, 1); }
          catch { continue; }
        else {
          this.latest++;
          continue;
        }
        this.latest++;

        chat = chat.substring(10); //substring(10) to "remove stranger: " part

        return chat;

      }
      catch {
        if (t > bot.options['timeout'] && t != -1)
          for (var i = 0; i < 3; i++)
            await (await bot.whenElement(By.css('.disconnectbtn'))).click();
        t++;
      }
    }
    this.sanity = 0;
    throw 'Sanity Lost';
  }

  async out(msg) { //returns the output
    try {
      msg = msg.replace(/(\r\n|\n|\r)/gm, Key.chord(Key.SHIFT, Key.ENTER));
      await (await bot.whenElement(By.css('.chatmsg'))).sendKeys(msg);
      await (await bot.whenElement(By.css('.sendbtn'))).click();
    } catch { }
  }

}; let neurons = new Neurons();

class Brain { //brain for the bot (kept in a seperate class to ensure versatility)

  constructor() {
    this.default_memory();
  }
  async default_memory() {
    await neurons.default_memory();
    this.allow_social = 0;
    this.times_msg = 0;
  }
  async start_thinking() { //controls incoming input and sorts them accodingly into thoughts (functions)
    io.emit('bot cmd', { 'command': 'log tail', 'reply': '-------------------\r' });

    await this.default_memory();
    while (neurons.sanity != 0) {
      let msg = (await neurons.latest_input()).toString();
      msg = msg.toLowerCase();

      if (msg == '/list') {
        neurons.out((`---
       /ttt : let's you play tic tac toe with me
       /rps : A match of Rock paper scissors with me
       /riddle : Care for a riddle?
       /joke : I'll tell you a joke!
       /lyrics : If you want the lyrics to your tunes
       /feedback : leave your feedback
       `)); //regex to replace \n with \r to avoid pressing enter mutliple times
      }
      else if (msg == '/lyrics') {
        try {
          await neurons.out(`---\rLyrics Finder\r------------\r\rI'll try my best to find your lyrics but I make no promises\r</exit to quit>\rEnter song name=>`);
          let song_name = await neurons.latest_input();
          if (song_name == '/exit') {
            await neurons.out('Terminated Search');
            continue;
          }
          await neurons.out('Hold on Fetching lyrics...');

          const Client = new Genius.Client();
          const searches = await Client.songs.search(song_name);
          if (searches.length == 0) {
            await neurons.out('Sorry Lyrics not found :/');
            continue;
          }

          const lyrics = await searches[0].lyrics();


          let lyrics_lines = lyrics.split("\n")
          for (let i = 0; i < lyrics_lines.length; i++) {
            let para = ''
            for (let j = i; j < i + 10 && j < lyrics_lines.length; j++)
              para += lyrics_lines[j] + "\n"
            i += 10
            await neurons.out(para);
          }

        }
        catch (err) { console.log('/lyrics error=>', err); await neurons.out('Sorry Lyrics crashed try again'); }
      }
      else if (msg == '/ttt') {
        let ttt = new Ttt();
        if (await ttt.play() == 1)
          this.allow_social = 1;
      }
      else if (msg == '/riddle') {
        let temp_no = Math.floor(Math.random() * (Object.keys(riddle_obj).length));
        let ans = Object.keys(riddle_obj)[temp_no];
        await neurons.out(`${riddle_obj[ans]}\rYour guess=>`);

        let reply = await (await neurons.latest_input()).toString();
        reply = reply.toLowerCase();

        if (ans == reply)
          await neurons.out("Correct! wow you're smart!");
        else
          await neurons.out(`Nah the answer is '${ans}'\r(Don't blame me I don't make these)`);
      }
      else if (msg == '/joke') {
        let temp_no = Math.floor(Math.random() * jokes_obj['lamejokes'].length);
        await neurons.out(jokes_obj['lamejokes'][temp_no]);
      }
      else if (msg == '/rps') {
        let score_obj = {
          "bot": 0,
          "you": 0
        };
        let game_loop = {
          '1': 'rock',
          '2': 'paper',
          '3': 'scissors',
          '01': ''
        };
        let t = bot.options['timeout'];
        try {

          await neurons.out(`---\r3 Points to win! </exit to quit>\r(bot) 0 : 0 (You)\r\r1=rock\r\r2=paper\r\r3=scissors\r\r`);

          while (neurons.sanity == 1) {

            await neurons.out(`Your Move=>`);
            let response = await neurons.latest_input();
            if (response == '/exit') {
              await neurons.out('lol chickened out so soon?');
              break;
            }
            response = Number(response);

            if (!isNaN(response) && 0 < response && response < 4) {
              let bot_action = Math.floor(Math.random() * 3) + 1;

              if (Number(Object.keys(game_loop)[bot_action]) == response) {
                await neurons.out(`---\rYou chose: ${game_loop[response]}\rBot chose: ${game_loop[bot_action]}\r(bot) ${score_obj['bot']} : ${++score_obj['you']} (You)\r\r`);
                if (score_obj['you'] == 3) {
                  await neurons.out(`You won\rPff you just got lucky`);
                  break;
                }
              }
              else if (response == bot_action)
                await neurons.out(`---\rYou chose: ${game_loop[response]}\rBot chose: ${game_loop[bot_action]}\r(bot) ${score_obj['bot']} : ${score_obj['you']} (You)\r\r`);
              else {
                await neurons.out(`---\rYou chose: ${game_loop[response]}\rBot chose: ${game_loop[bot_action]}\r(bot) ${++score_obj['bot']} : ${score_obj['you']} (You)\r\r`);
                if (score_obj['bot'] == 3) {
                  await neurons.out(`Ha! I won\rAs if you could ever beat me ;)`);
                  break;
                }
              }
            }
            else
              await neurons.out('Invalid Move Try again');
          }
        } catch { bot.options['timeout'] = t; throw err }
      }
      else if (msg == '/feedback') {
        let t = bot.options['timeout'];
        try {
          bot.options['timeout'] = -1;

          await neurons.out('Enter Your Name=>');
          let name = await neurons.latest_input();
          let feedback = `\r\r\r-----------\r${name} [${new Date().toLocaleString()}]\r-----------\r`;

          await neurons.out('Enter Your Feedback=>');
          feedback += await neurons.latest_input() + '\r';

          try {
            const log = createWriteStream('./_settings/feedback.txt', { flags: 'a' });
            log.write(feedback);
            log.end();

            bot.options['timeout'] = t;
            await neurons.out('Feedback Sent Successfully!');
          } catch { await neurons.out(`Couldn't reach creator,try again later\rsorry :/`); }
        } catch (err) { bot.options['timeout'] = t; throw err }
      }
      else {
        this.times_msg++;
        if (this.times_msg >= 20) {
          try {
            await (await bot.whenElement(By.css('.chatmsg'))).sendKeys(`Don't waste my time`);
            await (await bot.whenElement(By.css('.sendbtn'))).click();
            for (var i = 0; i < 3; i++)
              await (await bot.whenElement(By.css('.disconnectbtn'))).click();
          } catch { }

          throw 'Out of thinking loop';
        }
        neurons.out(`I'm sorry I don't recognise that command`);
        continue;
      }
      this.times_msg = 0;
    }
  }
};

class Bot {  //the bot body to ensure connections & non thought related activities 

  constructor() {
    this.status = 'inactive';
    this.driver;
    this.chat = '';


    if (existsSync('_settings/settings.json'))
      this.options = JSON.parse(readFileSync('_settings/settings.json', 'utf8'));
    else {
      this.options = {
        "greeting": "Hi I'm a Bot \r type /list for commands",
        "interests": "c01",
        "only interests": true,
        "timeout": 40,
        "port": 3000,
        "headless": false,
        "browser": 0,
        "_info_": "headless: true means that the browser will be invisible, browser:0=chrome 1=firefox"
      }

      writeFileSync('_settings/settings.json', JSON.stringify(this.options));
    }

    this.brain = new Brain(); //initializes new brain
  }

  async whenElement(by_identity, timeout = 1000, error = 0) { //finds element when it appears & returns it within timeout period else throws error (if error==1)
    try {
      return this.driver.wait(until.elementLocated(by_identity), timeout);
    }
    catch (err) {
      if (error == 1)
        throw err;
      console.log(`whenElement,ELEMENT ${by_identity} not found, ERROR=>${err}`);
    }
  }

  async whenElements(by_identity, timeout = 1000, error = 0) { //finds elements when they appears & returns them within timeout period else throws error (if error==1)
    try {
      return this.driver.wait(until.elementsLocated(by_identity), timeout)
    }
    catch (err) {
      if (error == 1)
        throw err;
      console.log(`whenElement,ELEMENT ${by_identity} not found, ERROR=>${err}`);
    }
  }

  async ifElement(by_identity, timeout = 1000) { //finds if element exists/can be located
    try {
      await this.driver.wait(until.elementLocated(by_identity), timeout);
      return true;
    }
    catch {
      return false;
    }
  }

  async readAttribute(by_element, attribute, timeout = 1000, error = 0) { // reads and returns the attribute of given element else throws error (if error==1)
    try {
      let text = '';
      await this.driver.wait(until.elementLocated(by_element), timeout).then(async (el) => {
        await el.getAttribute(attribute).then(txt => { text = txt; });
      });
      return text;
    }
    catch (err) {
      if (error == 1)
        throw err;
      console.log(`readAttribute,cannot read ATTRIBUTE ${attribute} of ELEMENT ${by_element.toString()},ERROR =>${err}`);
    }
  }

  async start(interests, browser_start = 1) { //starts the bot with the given interest

    this.status = 'active';
    if (browser_start == 1) {
      this.options['interests'] = `${interests},`;

      console.log(this.options['headless'])

      let browser = (this.options['browser'] == 0 ? "chrome" : "firefox")

      if (this.options['headless'])
        this.driver = await new Builder().forBrowser(browser).setFirefoxOptions(new firefox.Options().headless()).build(); //opens new browser & page
      else
        this.driver = await new Builder().forBrowser(browser)/*.setFirefoxOptions(new firefox.Options().headless())*/.build(); //opens new browser & page

      this.status = 'browser started';
    }
    await this.open_chat();
    try { this.conversate(); } catch (err) { console.log('start convo error=>', err); }
  }

  async open_chat() { //starts the chat by typing interests and agreeing to all terms

    // broadcast('going to omegle');
    await this.driver.get(`https://www.omegle.com`); //goes to the site
    this.status = 'on omegle starting page';

    (await this.whenElement(By.css('.newtopicinput'))).sendKeys(this.options['interests']);
    this.status = 'entered interests';

    (await this.whenElement(By.css('#textbtn'))).click(); //clicks on the text button
    this.status = 'clicked text button';

    for (var i = 1; i < 3; i++) //clicks on 2 radio box agreements
      (await this.whenElement(By.xpath(`/html/body/div[7]/div/p[${i}]/label/input`), 3000)).click();
    this.status = 'clicked 2 radio buttons';

    (await this.whenElement(By.xpath(`/html/body/div[7]/div/p[3]/input`), 3000)).click();
    this.status = 'clicked agree & continute button';

  }

  async conversate() { //does the actual communication between bot body and brain

    while (this.status != 'inactive' && this.status != 'captcha required') {
      try { await this.establish_connection(); } catch { continue; }

      try {
        try {
          await (await this.whenElement(By.css('.chatmsg'))).sendKeys(bot.options['greeting']); //sends generic message on connecting
          await (await this.whenElement(By.css('.sendbtn'))).click();
        } catch { }

        await this.brain.start_thinking();

      } catch (err) { console.log('inside catch 1=>', err); }
    }
    console.log('OUT of conversation loop');
  }

  async establish_connection() {

    while (this.status != 'inactive') {
      try { this.captcha(); } catch (err) { console.log('establish cap err=>', err) }
      try {
        while (!await (await this.whenElement(By.css('.sendbtn'), 10000)).isEnabled() && this.status != 'captcha required') { //loop to wait till send button is activated
          if (await this.ifElement(By.css('.newchatbtnwrapper')))
            await (await this.whenElement(By.css('.newchatbtnwrapper img'))).click();
        }
        if (this.status == 'captcha required')
          throw 'captcha found';
      } catch (err) { console.log('captcha err=>', err, this.status); neurons.sanity = 0; return; }
      try {
        if (this.options['interests'] != '' && this.options['only interests'])
          try {
            if ((await this.readAttribute(By.css(`.logitem:nth-of-type(2)`), 'innerText', 1000, 1)).startsWith(`Omegle couldn't find`)) {
              for (var i = 0; i < 3; i++)
                await (await this.whenElement(By.css('.disconnectbtn'))).click();
              continue;
            }
          } catch (err) { console.log('establish interest error=>', err); return; }
        return;
      } catch (err) { console.log('common interest based connection=>', err); return; }
    }
  }

  async instincts(msg) { //checks if msg is a bot body command and preforms them instinctively instead of letting them reach the brain
    if (msg == '/quit') {
      try {
        await (await this.whenElement(By.css('.chatmsg'))).sendKeys('Sad to see you go, hope we meet again :D');
        await (await this.whenElement(By.css('.sendbtn'))).click();
      } catch { }
      for (var i = 0; i < 3; i++)
        await (await this.whenElement(By.css('.disconnectbtn'))).click();
    }
    else
      return 0;
    return 1;
  }

  async captcha() { //checks if captcha is required
    try {
      if (await (await this.whenElement(By.css(`iframe[title='reCAPTCHA']`), 10000, 1)).isDisplayed()) {
        io.emit('bot cmd', { 'reply': 'captcha required' });
        this.status = 'captcha required';
        neurons.sanity = 0;
        return 1;
      }
    } catch { }

    console.log('captcha not required');
    if (this.status != 'inactive')
      this.status = 'captcha not required';
    return 0;
  }

  async kill() { //kills bot
    try { await this.driver.quit(); } catch { }
    this.status = 'inactive';
    neurons.sanity = 0;
  }

}; let bot = new Bot(); //creates new bot


app.get('/', (req, res) => { //returns index page on /
  res.sendFile(`index.html`, { root: './_public' });
});

app.get('/index', (req, res) => { //gives 404 if /index page is visited
  res.sendFile(`404.html`, { root: './_public' });
});

app.get('/', (req, res) => { //instead of creating a get() for every page, this get() sends non unique pages by :id 
  //non unique meaning pages that do not have subpages
  if (existsSync(`./index.html`))
    res.sendFile(dir, { root: './_public' });
  else
    res.sendFile(`404.html`, { root: './_public' });

});

app.get('/:id', (req, res) => { //instead of creating a get() for every page, this get() sends non unique pages by :id 
  //non unique meaning pages that do not have subpages
  let dir = `${req.params.id}.html`;
  if (existsSync(`./_public/${dir}`))
    res.sendFile(dir, { root: './_public' });
  else
    res.sendFile(`404.html`, { root: './_public' });


});

io.on('connection', (socket) => { //when new connection is established
  console.log(bot.status);

  if (bot.status == 'captcha required')//to let new connections know if captcha is required
    io.emit('bot cmd', { 'reply': 'captcha required' });

  socket.on('bot cmd', async (command) => { //comm line if a bot command is requested
    let cmd = command.split(' ');

    if (cmd[0] == 'start') { //starts/restarts the bot
      let restart = false
      if (bot.status != 'inactive') {
        restart = true
        bot.kill();
      }

      bot.start(bot.options['interests']);

      io.emit('bot cmd', { 'command': `BOT ${cmd[0].toUpperCase()}`, 'reply': `bot ${restart ? "restarted" : "started"} with interest='${bot.options['interests']}'` });
      return;
    }
    else if (cmd[0] == 'kill') { //kills/shutdowns the bot

      if (bot.status != 'inactive') {
        bot.kill();
        io.emit('bot cmd', { 'command': command, 'reply': 'bot has been terminated' });
      }
      else
        io.emit('bot cmd', { 'command': command, 'reply': 'bot is not yet active!' });

    }
    else
      io.emit('bot cmd', { 'command': command, 'reply': 'Unkown Command' });
  });

  socket.on('bot captcha', async (data) => { //comm line if captcha is being solved
    console.log('captcha message: ' + data.type);

    if (data.type == 'stat') { //sends status of bot
      io.emit('bot captcha', { 'type': bot.status });
    }
    else if (data.type == 'img') { //send the captcha images
      io.emit('bot captcha', await bot.get_captcha());
    }
    else if (data.type == 'press') { //if a captcha image is pressed
      bot.solve_captcha(data)
    }
    else if (data.type == 'verify') { //if captcha verify button is pressed, checks if further captcha is required
      await (await bot.whenElement(By.xpath(`/html/body/div/div/div[3]/div[2]/div[1]/div[2]/button`))).click();
      await new Promise(r => setTimeout(r, 3000));
      await bot.driver.switchTo().parentFrame();

      if ((await (await bot.whenElement(By.css(`iframe[title='recaptcha challenge']`))).getCssValue('visibility')) != 'hidden') {
        await bot.driver.switchTo().frame(bot.whenElement(By.css(`iframe[title='recaptcha challenge']`)));
        io.emit('bot captcha', await bot.get_captcha(1));
      }
      else {
        bot.status = 'captcha complete';

        io.emit('bot cmd', { 'reply': 'captcha complete!' });
        io.emit('bot captcha', { 'type': 'captcha complete' });
        try {
          await bot.driver.switchTo().parentFrame();
          for (var i = 0; i < 2; i++)
            await (await bot.whenElement(By.css('.disconnectbtn'))).click();
        } catch (err) { console.log('captcha complete error=>', err) }

        bot.start('', browser_start = 0);
      }

    }
  });

  socket.on('bot snapshot', async (data) => { //send the "screen shot" of what the bot is currently doing
    if (data.type == 'raw html') {

      if (bot.status == 'inactive')
        return io.emit('bot snapshot', { 'type': 'raw html', 'html': 'bot is inactive' })

      await bot.readAttribute(By.css('body'), 'innerHTML').then(html => {
        io.emit('bot snapshot', { 'type': 'raw html', 'html': html })
      });
    }
  });
});

server.listen(bot.options["port"], () => {
  console.log(`Listening at Port ${bot.options["port"]}...`);
});
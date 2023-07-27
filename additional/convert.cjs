const ejs=require('ejs')
const fs=require('fs')
const path=require('path')

const restricted_pages=['common'];
fs.rmSync(`${__dirname}/../_public`,{ recursive: true });
fs.mkdirSync(`${__dirname}/../_public`);
function ejs2html({ path, outPath, data, options }) {
    fs.readFile(path, "utf8", function(err, data) {
      if (err) {
        console.log(err);
        return false;
      }
      ejs.renderFile(path, data, options, (err, html) => {
        if (err) {
          console.log(err);
          return false;
        }
        fs.writeFile(outPath, html, function(err) {
          if (err) {
            console.log(err);
            return false;
          }
          return true;
        });
      });
    });
}

fs.readdirSync(`${__dirname}/../views/`).forEach(file => {
    if(path.extname(file)==''&&!restricted_pages.includes(file))
      ejs2html({
       path: `${__dirname}/../views/${file}/${file}.ejs`,
       outPath: `${__dirname}/../_public/${file}.html`
       });
});
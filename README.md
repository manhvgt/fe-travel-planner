# Travel Planner Project

## Project Summary
This project aims to give you the opportunity to put all of the skills you have learned into one project to build your own custom travel app. Due to the nature of this course, it is very JavaScript heavy, but it is still expected you create clean and appealing HTML/CSS. You will also be targeting the DOM, working with objects, and retrieving data from 3 APIs in which one of those is reliant on another to work. Finally, this is all going to be done in a Webpack environment, using an express server, and wrapped up with service workers.

Currently, The app will obtains a desired trip location & date from user, and displays weather and some images of the location using information obtained from external APIs.

For future development, It will allow user to save the trip into DB and review, edit, delete... (CRUD) and futher function...

## Tech
- HTML
- CCS
- JavaScript
- Build tools and other package
    + Webpack and plugins
    + Jest
    + ...

## Structure
<pre>
Project Root Directory
├── readme.md
├── __test__
│   └── app.test.js
│   └── index.test.js
├── src
│   ├── client
│   │   ├── index.js
│   │   ├── js
│   │   │   └── app.js
│   │   ├── styles
│   │   │   └── base.scss
│   │   │   └── footer.scss
│   │   │   └── form.scss
│   │   │   └── header.scss
│   │   │   └── output.scss
│   │   │   └── resets.scss
│   │   └── views
│   │       └── index.html 
│   └── server
│       └── index.js
├── .babelrc
├── .env
├── .gitignore
├── package.json
├── package.json.lock
├── webpack.dev.js
└── webpack.prod.js
</pre>

## Instructions
Before setting up and running this project, make sure NodeJS and npm are installed in your environment.
To install, run... Please go to project dirrectory and run below command on terminal (or cmd/windows powershell..).

### Setup
`npm install`
  - Check installation result on terminal. If project installed successfull, `node_module` directory will be created without error.

### Build
  - Dev envirionemnt:\
  `npm run build-dev`

  - Production envirionemnt:\
  `npm run build-prod`

### Test
  `npm run test`
  - Check the test result.

### Running 
  - Start backend:\
    `npm start`

  - Start the app using:\
  Dev:  `http://localhost:3000/`\
  Prod: `http://localhost:8080/`\

## License
This project is modified and updated for study purpose on Udacity.
Refer to https://github.com/manhvgt/fe-travel-planner

The original project (starter code) is belong to Udacity https://github.com/udacity/fend
(Browse to directory `weather-journal-app` on branch `refresh-2019`)

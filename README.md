# everest-sever

See the trello board at https://trello.com/b/hFeq8ZWt

Everest. 
Scheduling made easy.

This is the server that handles all the task scheduling logic. This is what the Android app talks to. After a task gets created (for example, visit mother in law every rainy day), the server gets the task name, It then does all the nifty little tricks to make sure you see your mother in law and you get reminded at the right time. 

Currently, the code is a mess.

But generally this is how it would work:

1. Server Receives Post Request (file is called index.js in 'routes' folder)
2. Server Processes the exact date and time to complete task
3. A scheduled message is created

This project is under the GNU GPLv3 license.
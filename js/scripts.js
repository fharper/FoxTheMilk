(function() {
    "use strict";
 
    //RTM object needed for all RTM requests
    window.rtm = new RememberTheMilk("b12c0529d94e97820b5e0add8b0fad43", "d7964700b178c31e", "delete");
    var dbVersion = 13;

    //Let's detect if we need to authorize RTM, need to upgrade the database to a new model or just go on
    var request = indexedDB.open("FoxTheMilkDB", dbVersion);

    //Load each tasks from a todo list
    function getTasks(item) {
        rtm.get('rtm.tasks.getList', {list_id: item.dataset.id, filter: 'status:incomplete'}, function(resp) {
        });
    }

    //Loading the lists of tasks on RTM
    function loadLists() {
        rtm.get('rtm.lists.getList', function(resp) {
            alert("error");
            var lists = document.querySelector("#lists");

            for (var i = 0; i < resp.rsp.lists.list.length; i++) {
                var list = document.createElement("button");
                list.innerHTML = resp.rsp.lists.list[i].name;
                list.setAttribute("data", "id: '" + resp.rsp.lists.list[i].id + "'");
                list.setAttribute("class", "list");
                //list.onclick = getTasks(list);
                lists.appendChild(list);
            }

            /*$('button.list').click(function(){
                $('#tasks').html('Loading...');
                var listId = $(this).data('id');

                rtm.get('rtm.tasks.getList', {list_id: listId, filter: 'status:incomplete'}, function(resp){
                    $('#tasks').empty();

                    if (!resp.rsp.tasks || !resp.rsp.tasks.list) {
                        $('#tasks').html('No tasks!');
                        return;
                    }

                    $.each(resp.rsp.tasks.list, function(index, listItem){
                        if (Object.prototype.toString.call(listItem.taskseries) != '[object Array]') {
                            listItem.taskseries = [listItem.taskseries];
                        }

                        $.each(listItem.taskseries, function(index, task){
                            var div = $('<div>').addClass('task-div');
                            $('<input>').attr('type', 'checkbox').appendTo(div);
                            $('<span>').html(task.name).appendTo(div);

                            div.appendTo($('#tasks'));
                        })
                    });
                })
            })*/
        });
    }

    //Saving the frob token from RTM for future use
    function saveToken(token) {
        rtm.auth_token = token;

        /* TODO
        var request = indexedDB.open("FoxTheMilkDB", dbVersion);
        request.onsuccess = function(event) {
            var db = event.target.result;
            var transaction = db.transaction(["settings"], "readwrite");
            var objectStore = transaction.objectStore("settings");
            var tokenData = {};
            tokenData.name = "token";
            tokenData.value = token;
            var request = objectStore.add(tokenData);
        }
        */
    }

    //Authorize this application to use RTM
    function authorize() {
      var browser = document.querySelector("#mozBrowser");

        //Know when the location change
        browser.addEventListener("mozbrowserlocationchange", function(event) {
            //We need to recuperate the frob
            if(event.detail.indexOf("lists.html") !== -1) {
                var frob = event.detail.split("frob=")[1].split("&")[0];

                rtm.get('rtm.auth.getToken', {frob: frob}, function(resp) {
                    saveToken(resp.rsp.auth.token);
                    browser.remove();
                    loadLists();
                });
            }
        });

        browser.setAttribute("src", rtm.getAuthUrl());
    }

    //No existing database, we need to get access to RTM, and create one
    request.onerror = function(event) {
        authorize();
    };

    //Need to upgrade the database to a newer data model
    request.onupgradeneeded = function(event) {
        
        //Creating the database
        var db = event.target.result;
        var objectStore = db.createObjectStore("settings", { keyPath: "id" });
        objectStore.createIndex("name", "name", { unique: true });
        objectStore.createIndex("value", "value", { unique: true });

        //Completing the creation
        /*objectStore.transaction.oncomplete = function(event) {
            var settingObjectStore = db.transaction("settings", "readwrite").objectStore("settings");
            for (var i in settingsData) {
                settingObjectStore.add(settingsData[i]);
            }
        }*/

        authorize();
    };

    //Everything is fine with the database, and we have access: let's use the application
    request.onsuccess = function(event) {
        var request = indexedDB.open("FoxTheMilkDB", dbVersion);
        loadLists();
    };
})();
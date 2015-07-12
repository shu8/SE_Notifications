// ==UserScript==
// @name         SE Notifications
// @namespace    http://stackexchange.com/users/4337810/
// @version      1.0.1
// @description  A userscript that adds notifications on any activity on a question open in another tab
// @author       ᔕᖺᘎᕊ (http://stackexchange.com/users/4337810/)
// @match        *://*.stackexchange.com/*
// @match        *://*.stackoverflow.com/*
// @match        *://*.superuser.com/*
// @match        *://*.serverfault.com/*
// @match        *://*.askubuntu.com/*
// @match        *://*.stackapps.com/*
// @match        *://*.mathoverflow.net/*
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==
if (window.location.href.indexOf('/users/') > -1) { //Add the add access token link
    $('.additional-links').append('<span class="lsep">|</span><a href="javascript:;" id="accessTokenLink-SENotifications">SE notifications access-token</a>');
    $('.sub-header-links.fr').append('<span class="lsep">|</span><a href="javascript:;" id="accessTokenLink-SENotifications">SE notifications access-token</a>'); //Old profile (pre Feb-2015)
    $('#accessTokenLink-SENotifications').click(function() {
        var token = window.prompt('Please enter your access token:');
        if(token) {
            GM_setValue("SENotifications-access_token", token);
        }
    });
}

if(GM_getValue('SENotifications-account_id', -1) == -1) {
    $.getJSON("https://api.stackexchange.com/2.2/users/"+$('body > div.topbar > div > div.topbar-links > a').attr('href').split('/')[2]+"?site="+$(location).attr('href').split('/')[2].split('.')[0], function(json) {
        GM_setValue('SENotifications-account_id', json.items[0].account_id);        
    });    
} else {
    if(GM_getValue('SENotifications-access_token', -1) != -1) { //if an access token IS set
        var siteId = (($(location).attr('href').split('/')[2] == 'meta.stackexchange.com') ? 4 : $('div.modal-content.current-site-container ul li:eq(0)>a').attr('data-id')),
            questionId = $(location).attr('href').split('/')[4],
            accountId = GM_getValue('SENotifications-account_id'),
            title = $('#question-header > h1 > a').text();

        var ws = new WebSocket("ws://qa.sockets.stackexchange.com/"); 

        ws.onopen = function() { 
            ws.send(siteId+"-question-"+questionId);
            ws.send(accountId+"-topbar");
            ws.send(accountId+"-inbox");
        };

        ws.onmessage = function(e) { 
            console.log(e);
            x = JSON.parse(JSON.parse(e.data).data);
            if (x.Inbox) {
                addNotification("New message!", "You have a new inbox message");
            }
            if (x.Achievements) {
                addNotification("New achievements!", "You have new achievements!");
            }
            switch(x.a) {
                case 'comment-add':
                    $.ajax({
                        type: "GET",
                        url: "https://api.stackexchange.com/2.2/comments/"+x.commentid+"?site="+$(location).attr('href').split('/')[2].split('.')[0]+"&filter=!SWJnaN3oHGHtDxq9GN&key=*DfXDOKcslMtjvxDKCfUFA((&access_token=aDNd5qHwB7KRpaEfOewDuw))",
                        success: function (json) {
                            addNotification("New comment!", "A new comment was added to one of the posts on '"+title+"' : " + json.items[0].body); 
                        },
                        dataType: "json"
                    });
                    break;
                case 'post-edit':
                    addNotification("Post edited!", "A post was edited on the question '"+title+"'");
                    break;
                case 'answer-add':
                    addNotification("New answer!", "An answer was posted to the question '"+title+"'");
                    break;
                case 'accept':
                    addNotification("Answer accepted!", "An answer on the question '"+title+"' was accepted");
                    break;
                case 'unaccept':
                    addNotification("Answer unaccepted!", "An answer on the question '"+title+"' was unaccepted");
                    break;
                case 'score':
                    addNotification("Post score change!", "A post on the question '"+title+"' score has changed");
                    break;
            }
        }; 
    } else {
        console.log("SE Notifications: Please get an access token from <> and enter it by going to your profile and clicking the 'SE Notifications access token' link at the top!");
    }
}

function addNotification(title, body) {
    Notification.requestPermission(function(permission){
        var notification = new Notification(title ,{
            body: body,
            icon: 'http://sstatic.net/stackexchange/img/logos/se/se-icon.png?v=93426798a1d4'
        });
        notification.onclick = function() {
            window.focus();
        };
    });
}

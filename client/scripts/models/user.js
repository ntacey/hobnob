/*
 * Literal constructor since this object should only ever have once instance
 */
var user = {
    // these will change after testing
    username : "ntacey",
    user_id : 001,
    screen_name : null,
    
    get_username : (function () {
        return this.username;
    }),
    
    get_user_id : (function () {
        return this.user_id;
    }),
    
    get_screen_name : (function () {
        return this.screen_name;
    })
}
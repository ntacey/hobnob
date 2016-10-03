Contact = function() {
    
    this.phoneNum = ""; //will need to support multiple phone numbers in the future
    this.name = "";
    this.picture = ""; //will be pointer to location in s3 bucket
    this.hobchatId = null; //will be an integer when set
    this.favorite = false; //boolean to determine whether to display up top
    
};

var contactList = []; //an array that will hold a list of contacts
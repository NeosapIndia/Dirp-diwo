require('dotenv').config();
let QUERY = {}
QUERY.doctor ={
    query   : 'select * from doctors', 
    header  : {
        'name':'name',
        'email'	: 'email',
        'phone': 'phone',
        'specialization': 'specialization',
        'address': 'address',
        'country': 'country',	
        'city':'city',
        'zip': 'zip',	
        'active': 'active',	
        'commission': 	'commission',
        'referralCode': 'referralCode'
    }
}
module.exports = QUERY;


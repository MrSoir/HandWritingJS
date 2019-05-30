
var StaticFunctions = {
	replaceString: function(s, args, ids=undefined){
	  for(let i=0; i < args.length; ++i){
	    let lastS = null;
	    while(s && s !== lastS){
	      lastS = s;
	      let replId = ids ? ids[i] : i;
	      s = s.replace('$!{' + replId + '}!$', args[i]);  }
	    }
	  return s;
	},
	
	shuffle: function(a) {
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	},
	sort: function(xs, valueGetter=v=>v){
		return xs.sort((v0, v1)=>{
			let val0 = valueGetter(v0);
			let val1 = valueGetter(v1);
			if(val0 > val1){
				return 1;
			}else if (val0 < val1){
				return -1;
			}
			return 0;
		});
	},
	arraysEqual: function(a0, a1){
		if (a0 === a1){return true;}
		if (a0 === null || a1 === null){return false;}
		if (a0.length !== a1.length){return false;}
		
		// 1. zip both arrays -> 2. check if every pair of elements are equal:
		return a0.map((v,i)=>[v, a1[i]]).every(v=>v[0] === v[1]);
	},
};


module.exports = StaticFunctions;

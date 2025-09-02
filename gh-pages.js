import { publish } from 'gh-pages';

publish(
	'build', // path to public directory
	{
		repo: 'https://github.com/CSU-InnOSeed/homepage.git', // Update to point to your repository
		branch: 'gh-pages-release',
		user: {
			name: 'wpcwzy', // update to use your name
			email: 'wpcwzy@outlook.com' // Update to use your email
		},
		dotfiles: true
	},
	(err) => {
		console.log(err);
		console.log('Deploy Complete!');
	}
);

# kissy-rails

Kissy! For Rails! So great.

This gem provides:

  * Kissy 1.2.0
  * the Kissy UJS adapter

## Installation

Apps generated with Rails 3.1 or later include kissy-rails in the Gemfile by default. So just make a new app:

```sh
rails new myapp
```

If upgrading from an older version of rails, or for rails 3.0 apps,
add the kissy-rails gem to your Gemfile.

```ruby
gem "kissy-rails"
```

And run `bundle install`. The rest of the installation depends on
whether the asset pipeline is being used.

### Rails 3.1 or greater (with asset pipeline *enabled*)

The kissy and kissy-ujs files will be added to the asset pipeline and available for you to use. If they're not already in `app/assets/javascripts/application.js` by default, add these lines:

```js
//= require kissy
//= require kissy_ujs
```


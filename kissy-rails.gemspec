# -*- encoding: utf-8 -*-
require File.expand_path('../lib/kissy/rails/version', __FILE__)

Gem::Specification.new do |s|
  s.name        = "kissy-rails"
  s.version     = Kissy::Rails::VERSION
  s.platform    = Gem::Platform::RUBY
  s.authors     = ["Jason Lee", "cricy"]
  s.email       = ["huacnlee@gmail.com", "feiyelanghai@gmail.com"]
  s.homepage    = "http://github.com/etaoux/kissy-rails"
  s.summary     = "Use Kissy with Rails 3"
  s.description = "This gem provides Kissy and the kissy-ujs driver for your Rails 3 application."

  s.required_rubygems_version = ">= 1.3.6"

  s.add_dependency "railties", ">= 3.2.0", "< 5.0"
  s.add_dependency "thor",     "~> 0.14"

  s.files        = `git ls-files`.split("\n")
  s.executables  = `git ls-files -- bin/*`.split("\n").map { |f| File.basename(f) }
  s.require_path = 'lib'
end

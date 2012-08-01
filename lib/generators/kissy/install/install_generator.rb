require 'rails'

# Supply generator for Rails 3.0.x or if asset pipeline is not enabled
if ::Rails.version < "3.1" || !::Rails.application.config.assets.enabled
  module Kissy
    module Generators
      class InstallGenerator < ::Rails::Generators::Base

        desc "This generator installs Kissy #{Kissy::Rails::KISSY_VERSION}, kissy-ujs"
        source_root File.expand_path('../../../../../vendor/assets/javascripts', __FILE__)

        def remove_prototype
          Rails::PROTOTYPE_JS.each do |name|
            remove_file "public/javascripts/#{name}.js"
          end
        end

        def copy_kissy
          say_status("copying", "Kissy (#{Kissy::Rails::KISSY_VERSION})", :green)
          copy_file "kissy.js", "public/javascripts/kissy.js"
          copy_file "kissy.min.js", "public/javascripts/kissy.min.js"
        end

        def copy_ujs_driver
          say_status("copying", "Kissy UJS adapter (#{Kissy::Rails::KISSY_UJS_VERSION[0..5]})", :green)
          remove_file "public/javascripts/rails.js"
          copy_file "kissy_ujs.js", "public/javascripts/kissy_ujs.js"
        end

      end
    end
  end
else
  module Kissy
    module Generators
      class InstallGenerator < ::Rails::Generators::Base
        desc "Just show instructions so people will know what to do when mistakenly using generator for Rails 3.1 apps"

        def do_nothing
          say_status("deprecated", "You are using Rails 3.1 with the asset pipeline enabled, so this generator is not needed.")
          say_status("", "The necessary files are already in your asset pipeline.")
          say_status("", "Just add `//= require kissy` and `//= require kissy_ujs` to your app/assets/javascripts/application.js")
          say_status("", "If you upgraded your app from Rails 3.0 and still have kissy.js, rails.js, or kissy_ujs.js in your javascripts, be sure to remove them.")
          say_status("", "If you do not want the asset pipeline enabled, you may turn it off in application.rb and re-run this generator.")
          # ok, nothing
        end
      end
    end
  end
end

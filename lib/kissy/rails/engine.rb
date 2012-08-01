require "kissy/assert_select" if ::Rails.env.test?

module Kissy
  module Rails
    class Engine < ::Rails::Engine
    end
  end
end
